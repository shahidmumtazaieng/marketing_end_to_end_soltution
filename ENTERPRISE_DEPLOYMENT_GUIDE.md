# 🚀 ENTERPRISE DEPLOYMENT GUIDE - COMPLETE PORT CONFIGURATION

## **🎯 CONFIRMED PORT ARCHITECTURE**

```
🌐 Frontend (3000)
    ↓
🔧 Node.js Backend (5000)
    ↓ ↙
📊 AI Calling Agent (8004)  +  🧠 ML Engine (8001)
    ↓                           ↓
📞 Twilio + ElevenLabs     🛡️ Advanced Scam Detection
🎭 Voice Cloning (8005)    🧠 NLP + RAG + Real-time Analysis
📊 Call Management         📊 ML Model Training
```

---

## **🔧 ENVIRONMENT VARIABLES CONFIGURATION**

### **🌐 1. FRONTEND (.env)**
```bash
# Copy marketing_end_to_end_soltution/.env.example to .env
cp marketing_end_to_end_soltution/.env.example marketing_end_to_end_soltution/.env

# Key Variables:
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_CALLING_AGENT_URL=http://localhost:8004
NEXT_PUBLIC_VOICE_CLONING_SERVICE_URL=http://localhost:8005
NEXT_PUBLIC_PYTHON_ML_ENGINE_URL=http://localhost:8001
```

### **🔧 2. NODE.JS BACKEND (.env)**
```bash
# Copy backend/.env.example to backend/.env
cp backend/.env.example backend/.env

# Key Variables:
PORT=5000
AI_CALLING_AGENT_URL=http://localhost:8004
VOICE_CLONING_SERVICE_URL=http://localhost:8005
PYTHON_ML_ENGINE_URL=http://localhost:8001
```

### **🤖 3. AI CALLING AGENT (.env)**
```bash
# Copy backend-python/services/ai_calling_agent/.env.example to .env
cp backend-python/services/ai_calling_agent/.env.example backend-python/services/ai_calling_agent/.env

# Key Variables:
PORT=8004
VOICE_CLONING_SERVICE_URL=http://localhost:8005
ML_ENGINE_URL=http://localhost:8001
MAIN_BACKEND_URL=http://localhost:5000
```

### **🎭 4. VOICE CLONING SERVICE (.env)**
```bash
# Copy backend-python/services/voice_cloning/.env.example to .env
cp backend-python/services/voice_cloning/.env.example backend-python/services/voice_cloning/.env

# Key Variables:
PORT=8005
CALLING_AGENT_URL=http://localhost:8004
MAIN_API_URL=http://localhost:3000
```

### **🧠 5. PYTHON ML ENGINE (.env)**
```bash
# Copy python-ml-engine/.env.example to .env
cp python-ml-engine/.env.example python-ml-engine/.env

# Key Variables:
PORT=8001
AI_CALLING_AGENT_URL=http://localhost:8004
VOICE_CLONING_SERVICE_URL=http://localhost:8005
MAIN_BACKEND_URL=http://localhost:5000
```

---

## **🚀 DEPLOYMENT COMMANDS**

### **📋 Prerequisites:**
```bash
# Install Node.js dependencies
cd marketing_end_to_end_soltution && npm install
cd ../backend && npm install

# Install Python dependencies
cd ../backend-python/services/ai_calling_agent && pip install -r requirements.txt
cd ../voice_cloning && pip install -r requirements.txt
cd ../../../python-ml-engine && pip install -r requirements.txt
```

### **🌐 1. Start Frontend (Port 3000):**
```bash
cd marketing_end_to_end_soltution
npm run dev
# ✅ Frontend running on http://localhost:3000
```

### **🔧 2. Start Node.js Backend (Port 5000):**
```bash
cd backend
npm run dev
# ✅ Backend running on http://localhost:5000
```

### **🤖 3. Start AI Calling Agent (Port 8004):**
```bash
cd backend-python/services/ai_calling_agent
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
# ✅ AI Calling Agent running on http://localhost:8004
```

### **🎭 4. Start Voice Cloning Service (Port 8005):**
```bash
cd backend-python/services/voice_cloning
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
# ✅ Voice Cloning running on http://localhost:8005
```

### **🧠 5. Start Python ML Engine (Port 8001):**
```bash
cd python-ml-engine
python app/main.py
# ✅ ML Engine running on http://localhost:8001
```

---

## **🔗 SERVICE COMMUNICATION FLOW**

### **📊 Data Flow:**
```
1. User Action (Frontend:3000)
   ↓
2. API Request (Backend:5000)
   ↓
3. AI Processing (ML Engine:8001)
   ↓
4. Call Initiation (AI Calling Agent:8004)
   ↓
5. Voice Synthesis (Voice Cloning:8005)
   ↓
6. External APIs (Twilio, ElevenLabs)
```

### **🔄 Integration Points:**
```
Frontend → Backend: REST API calls
Backend → Python Services: HTTP requests via pythonAiClient.js
AI Calling Agent → Voice Cloning: Direct service calls
AI Calling Agent → ML Engine: Real-time analysis
Voice Cloning → ElevenLabs: Voice synthesis
AI Calling Agent → Twilio: Phone calls
```

---

## **✅ HEALTH CHECK ENDPOINTS**

### **🩺 Service Health Checks:**
```bash
# Frontend
curl http://localhost:3000/api/health

# Backend
curl http://localhost:5000/health

# AI Calling Agent
curl http://localhost:8004/health

# Voice Cloning
curl http://localhost:8005/health

# ML Engine
curl http://localhost:8001/health
```

---

## **🛠️ TROUBLESHOOTING**

### **🚨 Common Issues:**

#### **Port Conflicts:**
```bash
# Check if ports are in use
netstat -an | findstr :3000
netstat -an | findstr :5000
netstat -an | findstr :8001
netstat -an | findstr :8004
netstat -an | findstr :8005

# Kill processes if needed
taskkill /PID <process_id> /F
```

#### **Service Connection Issues:**
```bash
# Test service connectivity
curl -v http://localhost:8004/health
curl -v http://localhost:8005/health
curl -v http://localhost:8001/health
```

#### **Environment Variable Issues:**
```bash
# Verify environment variables are loaded
echo $AI_CALLING_AGENT_URL
echo $VOICE_CLONING_SERVICE_URL
echo $PYTHON_ML_ENGINE_URL
```

---

## **📊 MONITORING & LOGS**

### **📝 Log Locations:**
```
Frontend: Browser console + Next.js logs
Backend: ./backend/logs/
AI Calling Agent: ./backend-python/services/ai_calling_agent/logs/
Voice Cloning: ./backend-python/services/voice_cloning/logs/
ML Engine: ./python-ml-engine/logs/
```

### **📈 Performance Monitoring:**
```bash
# Check service performance
curl http://localhost:5000/api/health/stats
curl http://localhost:8004/health
curl http://localhost:8005/health
curl http://localhost:8001/health
```

---

## **🔐 SECURITY CONSIDERATIONS**

### **🛡️ API Keys:**
```bash
# Required API Keys:
- ELEVENLABS_API_KEY (Voice synthesis)
- TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN (Phone calls)
- OPENAI_API_KEY (LLM processing)
- SERPAPI_KEY (Data scraping)
- SUPABASE_URL & SUPABASE_ANON_KEY (Database)
```

### **🔒 Network Security:**
```bash
# Firewall rules (production)
Allow: 3000 (Frontend)
Allow: 5000 (Backend API)
Block: 8001, 8004, 8005 (Internal services only)
```

---

## **🎯 VERIFICATION CHECKLIST**

### **✅ Deployment Verification:**
```
□ Frontend loads at http://localhost:3000
□ Backend API responds at http://localhost:5000/health
□ AI Calling Agent responds at http://localhost:8004/health
□ Voice Cloning responds at http://localhost:8005/health
□ ML Engine responds at http://localhost:8001/health
□ All environment variables configured
□ Database connections working
□ External API keys configured
□ Service-to-service communication working
□ Logs are being generated
```

---

**🎯 DEPLOYMENT COMPLETE!**

**Your enterprise AI calling system is now running with:**
- ✅ **Frontend** on port 3000
- ✅ **Backend** on port 5000  
- ✅ **AI Calling Agent** on port 8004
- ✅ **Voice Cloning** on port 8005
- ✅ **ML Engine** on port 8001
- ✅ **Complete service integration**

**This is production-ready, enterprise-grade deployment!** 🚀✨
