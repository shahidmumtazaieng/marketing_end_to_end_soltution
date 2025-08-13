"""
AI-Powered Vendor Selection Agent
Advanced vendor selection using Pydantic AI and LangGraph with intelligent decision making
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from langgraph.graph import Graph, StateGraph, END
from langgraph.prebuilt import ToolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# PYDANTIC MODELS
# ==========================================

class ServiceType(str, Enum):
    AC_REPAIR = "AC Repair"
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    CLEANING = "Cleaning"
    PAINTING = "Painting"
    CARPENTRY = "Carpentry"
    LANDSCAPING = "Landscaping"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class VendorStatus(str, Enum):
    ACTIVE = "active"
    BUSY = "busy"
    OFFLINE = "offline"
    BLOCKED = "blocked"

@dataclass
class Location:
    latitude: float
    longitude: float
    address: str = ""

class VendorData(BaseModel):
    vendor_id: str
    name: str
    email: str
    phone: str
    services: List[ServiceType]
    location: Location
    status: VendorStatus
    
    # Performance metrics
    total_orders: int = 0
    completed_orders: int = 0
    cancelled_orders: int = 0
    average_rating: float = 0.0
    completion_rate: float = 0.0
    response_time_minutes: float = 60.0
    
    # Current workload
    current_orders: int = 0
    is_online: bool = False
    last_seen: datetime = Field(default_factory=datetime.now)
    
    # Availability
    working_hours: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    max_concurrent_orders: int = 3

class ServiceRequest(BaseModel):
    request_id: str
    user_id: str
    customer_name: str
    customer_location: Location
    service_type: ServiceType
    description: str
    priority: Priority
    estimated_value: float
    preferred_time: Optional[datetime] = None
    special_requirements: List[str] = Field(default_factory=list)

class VendorSelectionResult(BaseModel):
    selected_vendors: List[str]  # vendor_ids
    primary_vendor: str
    fallback_vendors: List[str]
    selection_reasoning: str
    confidence_score: float
    estimated_response_time: int  # minutes
    selection_metadata: Dict[str, Any] = Field(default_factory=dict)

# ==========================================
# AI AGENT STATE
# ==========================================

class AgentState(BaseModel):
    service_request: ServiceRequest
    available_vendors: List[VendorData]
    filtered_vendors: List[VendorData] = Field(default_factory=list)
    scored_vendors: List[Tuple[VendorData, float]] = Field(default_factory=list)
    selection_result: Optional[VendorSelectionResult] = None
    reasoning_steps: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None

# ==========================================
# VENDOR SELECTION AGENT
# ==========================================

class AIVendorSelectionAgent:
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model
        
        # Initialize Pydantic AI agent
        self.ai_agent = Agent(
            model=model,
            system_prompt=self._get_system_prompt(),
            result_type=VendorSelectionResult,
        )
        
        # Initialize LangGraph workflow
        self.workflow = self._create_workflow()
        
        logger.info("AI Vendor Selection Agent initialized")

    def _get_system_prompt(self) -> str:
        return """
        You are an expert AI vendor selection agent for a service marketplace platform.
        Your role is to intelligently select the best vendors for customer service requests.
        
        Consider these factors in your decision making:
        1. Service type compatibility
        2. Geographic proximity and travel time
        3. Vendor performance history and ratings
        4. Current availability and workload
        5. Response time patterns
        6. Customer priority level
        7. Vendor specialization and expertise
        8. Fair opportunity distribution for new vendors
        
        Always provide clear reasoning for your selections and consider both
        performance optimization and fairness in vendor opportunity distribution.
        
        For urgent requests, prioritize availability and proximity.
        For regular requests, balance performance with opportunity for newer vendors.
        """

    def _create_workflow(self) -> StateGraph:
        """Create LangGraph workflow for vendor selection"""
        
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("filter_vendors", self._filter_vendors)
        workflow.add_node("analyze_location", self._analyze_location)
        workflow.add_node("score_performance", self._score_performance)
        workflow.add_node("check_availability", self._check_availability)
        workflow.add_node("apply_ai_selection", self._apply_ai_selection)
        workflow.add_node("validate_selection", self._validate_selection)
        
        # Add edges
        workflow.add_edge("filter_vendors", "analyze_location")
        workflow.add_edge("analyze_location", "score_performance")
        workflow.add_edge("score_performance", "check_availability")
        workflow.add_edge("check_availability", "apply_ai_selection")
        workflow.add_edge("apply_ai_selection", "validate_selection")
        workflow.add_edge("validate_selection", END)
        
        # Set entry point
        workflow.set_entry_point("filter_vendors")
        
        return workflow.compile()

    # ==========================================
    # WORKFLOW NODES
    # ==========================================

    async def _filter_vendors(self, state: AgentState) -> AgentState:
        """Filter vendors by service type and basic availability"""
        try:
            request = state.service_request
            
            filtered = []
            for vendor in state.available_vendors:
                # Check service type compatibility
                if request.service_type not in vendor.services:
                    continue
                
                # Check if vendor is not blocked
                if vendor.status == VendorStatus.BLOCKED:
                    continue
                
                # Check if vendor is not overloaded
                if vendor.current_orders >= vendor.max_concurrent_orders:
                    continue
                
                filtered.append(vendor)
            
            state.filtered_vendors = filtered
            state.reasoning_steps.append(
                f"Filtered {len(filtered)} vendors from {len(state.available_vendors)} "
                f"based on service type ({request.service_type}) and availability"
            )
            
            logger.info(f"Filtered vendors: {len(filtered)} remaining")
            return state
            
        except Exception as e:
            state.error_message = f"Error in vendor filtering: {str(e)}"
            logger.error(state.error_message)
            return state

    async def _analyze_location(self, state: AgentState) -> AgentState:
        """Analyze vendor locations and calculate distances"""
        try:
            request = state.service_request
            customer_loc = request.customer_location
            
            vendors_with_distance = []
            for vendor in state.filtered_vendors:
                distance = self._calculate_distance(
                    customer_loc.latitude, customer_loc.longitude,
                    vendor.location.latitude, vendor.location.longitude
                )
                
                # Add distance to vendor data (temporary)
                vendor_dict = vendor.dict()
                vendor_dict['distance_km'] = distance
                vendor_dict['in_service_area'] = distance <= 25  # 25km service radius
                
                if vendor_dict['in_service_area']:
                    vendors_with_distance.append(VendorData(**vendor_dict))
            
            state.filtered_vendors = vendors_with_distance
            state.reasoning_steps.append(
                f"Location analysis: {len(vendors_with_distance)} vendors within 25km service area"
            )
            
            logger.info(f"Location filtered vendors: {len(vendors_with_distance)}")
            return state
            
        except Exception as e:
            state.error_message = f"Error in location analysis: {str(e)}"
            logger.error(state.error_message)
            return state

    async def _score_performance(self, state: AgentState) -> AgentState:
        """Score vendors based on performance metrics"""
        try:
            scored_vendors = []
            
            for vendor in state.filtered_vendors:
                score = self._calculate_performance_score(vendor, state.service_request)
                scored_vendors.append((vendor, score))
            
            # Sort by score (highest first)
            scored_vendors.sort(key=lambda x: x[1], reverse=True)
            state.scored_vendors = scored_vendors
            
            state.reasoning_steps.append(
                f"Performance scoring completed for {len(scored_vendors)} vendors"
            )
            
            logger.info(f"Performance scored vendors: {len(scored_vendors)}")
            return state
            
        except Exception as e:
            state.error_message = f"Error in performance scoring: {str(e)}"
            logger.error(state.error_message)
            return state

    async def _check_availability(self, state: AgentState) -> AgentState:
        """Check real-time vendor availability"""
        try:
            available_vendors = []
            
            for vendor, score in state.scored_vendors:
                if self._is_vendor_available(vendor, state.service_request):
                    available_vendors.append((vendor, score))
            
            state.scored_vendors = available_vendors
            state.reasoning_steps.append(
                f"Availability check: {len(available_vendors)} vendors currently available"
            )
            
            logger.info(f"Available vendors: {len(available_vendors)}")
            return state
            
        except Exception as e:
            state.error_message = f"Error in availability check: {str(e)}"
            logger.error(state.error_message)
            return state

    async def _apply_ai_selection(self, state: AgentState) -> AgentState:
        """Apply AI-powered intelligent selection"""
        try:
            if not state.scored_vendors:
                state.error_message = "No available vendors found"
                return state
            
            # Prepare data for AI agent
            vendor_data = []
            for vendor, score in state.scored_vendors[:10]:  # Top 10 vendors
                vendor_info = {
                    "vendor_id": vendor.vendor_id,
                    "name": vendor.name,
                    "performance_score": score,
                    "rating": vendor.average_rating,
                    "completion_rate": vendor.completion_rate,
                    "response_time": vendor.response_time_minutes,
                    "current_orders": vendor.current_orders,
                    "is_online": vendor.is_online,
                    "distance_km": getattr(vendor, 'distance_km', 0),
                }
                vendor_data.append(vendor_info)
            
            # Create context for AI agent
            context = {
                "service_request": state.service_request.dict(),
                "available_vendors": vendor_data,
                "selection_criteria": {
                    "priority": state.service_request.priority,
                    "service_type": state.service_request.service_type,
                    "estimated_value": state.service_request.estimated_value,
                }
            }
            
            # Run AI agent
            result = await self.ai_agent.run(
                f"Select the best vendors for this service request: {json.dumps(context, indent=2)}"
            )
            
            state.selection_result = result.data
            state.reasoning_steps.append("AI-powered vendor selection completed")
            
            logger.info("AI selection completed")
            return state
            
        except Exception as e:
            state.error_message = f"Error in AI selection: {str(e)}"
            logger.error(state.error_message)
            return state

    async def _validate_selection(self, state: AgentState) -> AgentState:
        """Validate and finalize vendor selection"""
        try:
            if not state.selection_result:
                state.error_message = "No selection result available"
                return state
            
            # Validate selected vendors exist and are available
            selected_vendor_ids = state.selection_result.selected_vendors
            valid_vendors = []
            
            for vendor, score in state.scored_vendors:
                if vendor.vendor_id in selected_vendor_ids:
                    valid_vendors.append(vendor.vendor_id)
            
            if not valid_vendors:
                # Fallback to top scored vendor
                if state.scored_vendors:
                    top_vendor = state.scored_vendors[0][0]
                    valid_vendors = [top_vendor.vendor_id]
                    state.selection_result.selected_vendors = valid_vendors
                    state.selection_result.primary_vendor = top_vendor.vendor_id
                    state.selection_result.selection_reasoning += " (Fallback to top-scored vendor)"
            
            state.reasoning_steps.append(
                f"Selection validated: {len(valid_vendors)} vendors confirmed"
            )
            
            logger.info("Selection validation completed")
            return state
            
        except Exception as e:
            state.error_message = f"Error in selection validation: {str(e)}"
            logger.error(state.error_message)
            return state

    # ==========================================
    # UTILITY METHODS
    # ==========================================

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = np.radians(lat1)
        lon1_rad = np.radians(lon1)
        lat2_rad = np.radians(lat2)
        lon2_rad = np.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c

    def _calculate_performance_score(self, vendor: VendorData, request: ServiceRequest) -> float:
        """Calculate comprehensive performance score for vendor"""
        score = 0.0
        
        # Base performance metrics (40% weight)
        if vendor.total_orders > 0:
            completion_rate = vendor.completed_orders / vendor.total_orders
            score += completion_rate * 40
        
        # Rating score (25% weight)
        rating_score = (vendor.average_rating / 5.0) * 25
        score += rating_score
        
        # Response time score (15% weight)
        # Better score for faster response (inverse relationship)
        response_score = max(0, (120 - vendor.response_time_minutes) / 120) * 15
        score += response_score
        
        # Availability bonus (10% weight)
        if vendor.is_online:
            score += 10
        
        # Workload penalty (10% weight)
        workload_factor = 1 - (vendor.current_orders / vendor.max_concurrent_orders)
        score += workload_factor * 10
        
        # Priority adjustments
        if request.priority == Priority.URGENT:
            if vendor.is_online and vendor.current_orders == 0:
                score += 20  # Urgent bonus for immediately available vendors
        elif request.priority == Priority.LOW:
            # Give opportunity to newer vendors
            if vendor.total_orders < 10:
                score += 15
        
        return min(score, 100.0)  # Cap at 100

    def _is_vendor_available(self, vendor: VendorData, request: ServiceRequest) -> bool:
        """Check if vendor is currently available for new orders"""
        # Check basic availability
        if vendor.status != VendorStatus.ACTIVE:
            return False
        
        # Check workload
        if vendor.current_orders >= vendor.max_concurrent_orders:
            return False
        
        # Check if online for urgent requests
        if request.priority == Priority.URGENT and not vendor.is_online:
            return False
        
        # Check last seen (vendor should be active within last 24 hours)
        if datetime.now() - vendor.last_seen > timedelta(hours=24):
            return False
        
        return True

    # ==========================================
    # MAIN SELECTION METHOD
    # ==========================================

    async def select_vendors(
        self, 
        service_request: ServiceRequest, 
        available_vendors: List[VendorData]
    ) -> VendorSelectionResult:
        """Main method to select vendors for a service request"""
        try:
            logger.info(f"Starting vendor selection for request: {service_request.request_id}")
            
            # Initialize state
            initial_state = AgentState(
                service_request=service_request,
                available_vendors=available_vendors
            )
            
            # Run workflow
            final_state = await self.workflow.ainvoke(initial_state)
            
            if final_state.error_message:
                logger.error(f"Vendor selection failed: {final_state.error_message}")
                # Return empty result
                return VendorSelectionResult(
                    selected_vendors=[],
                    primary_vendor="",
                    fallback_vendors=[],
                    selection_reasoning=f"Selection failed: {final_state.error_message}",
                    confidence_score=0.0,
                    estimated_response_time=0
                )
            
            if not final_state.selection_result:
                logger.warning("No selection result generated")
                return VendorSelectionResult(
                    selected_vendors=[],
                    primary_vendor="",
                    fallback_vendors=[],
                    selection_reasoning="No suitable vendors found",
                    confidence_score=0.0,
                    estimated_response_time=0
                )
            
            # Add reasoning steps to metadata
            final_state.selection_result.selection_metadata = {
                "reasoning_steps": final_state.reasoning_steps,
                "total_vendors_considered": len(available_vendors),
                "filtered_vendors": len(final_state.filtered_vendors),
                "scored_vendors": len(final_state.scored_vendors),
                "selection_timestamp": datetime.now().isoformat(),
            }
            
            logger.info(f"Vendor selection completed successfully for request: {service_request.request_id}")
            return final_state.selection_result
            
        except Exception as e:
            logger.error(f"Unexpected error in vendor selection: {str(e)}")
            return VendorSelectionResult(
                selected_vendors=[],
                primary_vendor="",
                fallback_vendors=[],
                selection_reasoning=f"Unexpected error: {str(e)}",
                confidence_score=0.0,
                estimated_response_time=0
            )

# ==========================================
# EXAMPLE USAGE
# ==========================================

async def main():
    """Example usage of AI Vendor Selection Agent"""
    
    # Initialize agent
    agent = AIVendorSelectionAgent(api_key="your-openai-api-key")
    
    # Example service request
    request = ServiceRequest(
        request_id="REQ-001",
        user_id="user-123",
        customer_name="John Doe",
        customer_location=Location(latitude=40.7128, longitude=-74.0060),
        service_type=ServiceType.AC_REPAIR,
        description="AC unit not cooling properly",
        priority=Priority.HIGH,
        estimated_value=250.0
    )
    
    # Example vendors
    vendors = [
        VendorData(
            vendor_id="vendor-1",
            name="AC Pro Services",
            email="contact@acpro.com",
            phone="+1-555-0123",
            services=[ServiceType.AC_REPAIR],
            location=Location(latitude=40.7589, longitude=-73.9851),
            status=VendorStatus.ACTIVE,
            total_orders=150,
            completed_orders=145,
            average_rating=4.8,
            is_online=True,
            current_orders=1
        ),
        # Add more vendors...
    ]
    
    # Select vendors
    result = await agent.select_vendors(request, vendors)
    
    print("Vendor Selection Result:")
    print(f"Selected Vendors: {result.selected_vendors}")
    print(f"Primary Vendor: {result.primary_vendor}")
    print(f"Reasoning: {result.selection_reasoning}")
    print(f"Confidence: {result.confidence_score}")

if __name__ == "__main__":
    asyncio.run(main())
