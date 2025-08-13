#!/usr/bin/env python3
"""
AI Vendor Selection API Wrapper
Provides API interface for the AI vendor selection agent
"""

import sys
import json
import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any

# Import the AI vendor selection agent
from ai_vendor_selection_agent import (
    AIVendorSelectionAgent,
    ServiceRequest,
    VendorData,
    Location,
    ServiceType,
    Priority,
    VendorStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AIVendorSelectionAPI:
    def __init__(self):
        self.agent = None
        
    async def initialize_agent(self, api_key: str) -> bool:
        """Initialize the AI agent with API key"""
        try:
            self.agent = AIVendorSelectionAgent(api_key=api_key)
            logger.info("AI Vendor Selection Agent initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize AI agent: {str(e)}")
            return False
    
    def parse_service_request(self, data: Dict[str, Any]) -> ServiceRequest:
        """Parse service request from API data"""
        try:
            location = Location(
                latitude=data['customer_location']['latitude'],
                longitude=data['customer_location']['longitude'],
                address=data['customer_location'].get('address', '')
            )
            
            # Parse preferred time if provided
            preferred_time = None
            if data.get('preferred_time'):
                preferred_time = datetime.fromisoformat(data['preferred_time'].replace('Z', '+00:00'))
            
            return ServiceRequest(
                request_id=data['request_id'],
                user_id=data['user_id'],
                customer_name=data['customer_name'],
                customer_location=location,
                service_type=ServiceType(data['service_type']),
                description=data['description'],
                priority=Priority(data['priority']),
                estimated_value=float(data['estimated_value']),
                preferred_time=preferred_time,
                special_requirements=data.get('special_requirements', [])
            )
        except Exception as e:
            raise ValueError(f"Invalid service request data: {str(e)}")
    
    def parse_vendor_data(self, vendor_list: list) -> list[VendorData]:
        """Parse vendor data from API data"""
        try:
            vendors = []
            for vendor_data in vendor_list:
                location = Location(
                    latitude=vendor_data['location']['latitude'],
                    longitude=vendor_data['location']['longitude'],
                    address=vendor_data['location'].get('address', '')
                )
                
                # Parse services
                services = [ServiceType(service) for service in vendor_data['services']]
                
                # Parse last seen
                last_seen = datetime.now()
                if vendor_data.get('last_seen'):
                    last_seen = datetime.fromisoformat(vendor_data['last_seen'].replace('Z', '+00:00'))
                
                vendor = VendorData(
                    vendor_id=vendor_data['vendor_id'],
                    name=vendor_data['name'],
                    email=vendor_data['email'],
                    phone=vendor_data['phone'],
                    services=services,
                    location=location,
                    status=VendorStatus(vendor_data.get('status', 'active')),
                    total_orders=vendor_data.get('total_orders', 0),
                    completed_orders=vendor_data.get('completed_orders', 0),
                    cancelled_orders=vendor_data.get('cancelled_orders', 0),
                    average_rating=float(vendor_data.get('average_rating', 0.0)),
                    completion_rate=float(vendor_data.get('completion_rate', 0.0)),
                    response_time_minutes=float(vendor_data.get('response_time_minutes', 60.0)),
                    current_orders=vendor_data.get('current_orders', 0),
                    is_online=vendor_data.get('is_online', False),
                    last_seen=last_seen,
                    working_hours=vendor_data.get('working_hours', {}),
                    max_concurrent_orders=vendor_data.get('max_concurrent_orders', 3)
                )
                vendors.append(vendor)
            
            return vendors
        except Exception as e:
            raise ValueError(f"Invalid vendor data: {str(e)}")
    
    async def process_selection_request(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process vendor selection request"""
        try:
            # Get API key
            api_key = input_data.get('api_key') or os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OpenAI API key is required")
            
            # Initialize agent if not already done
            if not self.agent:
                success = await self.initialize_agent(api_key)
                if not success:
                    raise RuntimeError("Failed to initialize AI agent")
            
            # Parse input data
            service_request = self.parse_service_request(input_data['service_request'])
            available_vendors = self.parse_vendor_data(input_data['available_vendors'])
            
            logger.info(f"Processing selection request: {service_request.request_id}")
            logger.info(f"Available vendors: {len(available_vendors)}")
            
            # Perform vendor selection
            selection_result = await self.agent.select_vendors(service_request, available_vendors)
            
            # Convert result to dictionary
            result_dict = {
                "selected_vendors": selection_result.selected_vendors,
                "primary_vendor": selection_result.primary_vendor,
                "fallback_vendors": selection_result.fallback_vendors,
                "selection_reasoning": selection_result.selection_reasoning,
                "confidence_score": selection_result.confidence_score,
                "estimated_response_time": selection_result.estimated_response_time,
                "selection_metadata": selection_result.selection_metadata,
                "algorithm_version": "pydantic_ai_langgraph_v1",
                "processing_time": datetime.now().isoformat(),
            }
            
            logger.info(f"Selection completed successfully: {len(selection_result.selected_vendors)} vendors selected")
            return result_dict
            
        except Exception as e:
            logger.error(f"Error processing selection request: {str(e)}")
            raise

async def main():
    """Main function to handle API requests"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create API instance
        api = AIVendorSelectionAPI()
        
        # Process the request
        result = await api.process_selection_request(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        error_result = {
            "error": "Invalid JSON input",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
        
    except ValueError as e:
        error_result = {
            "error": "Invalid input data",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "error": "Processing failed",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
