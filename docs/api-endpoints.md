# LOL Analyzer MVP - API Endpoints Documentation

## 🚀 Current Status: PRODUCTION READY ✅

All endpoints have been tested and are fully functional as of June 23, 2025.

## 📋 Base Information
- **Base URL**: `http://localhost:3001`
- **Environment**: Development
- **Port**: 3001
- **AI Provider**: Groq (Llama 3.1 8B Instant)
- **Database**: MySQL 8.0

## 🧪 Health & Status Endpoints

### Health Check
**Endpoint**: `GET /health`
**Status**: ✅ Working
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/health"
```
**Response**: Basic server health status

### AI Validation
**Endpoint**: `GET /api/ai/validate`
**Status**: ✅ Working
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/validate"
```
**Response**: AI service connectivity validation

### Meta Analysis Info
**Endpoint**: `GET /api/ai/meta-analysis`
**Status**: ✅ Working
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/meta-analysis"
```
**Response**: Current meta context and analysis capabilities

## 👤 Summoner Endpoints

### Get Summoner Data
**Endpoint**: `GET /api/summoner/:region/:summonerName`
**Status**: ✅ Working
**Format**: Supports RiotID format (e.g., GraveMan#CLN)
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/summoner/la1/GraveMan%23CLN"
```
**Response**: 
- Summoner profile information
- Ranked statistics
- Recent match history
- Basic performance metrics

## 🧠 AI Analysis Endpoints

### Performance Analysis
**Endpoint**: `POST /api/ai/analyze/:region/:summonerName`
**Status**: ✅ Working
**Features**:
- Enhanced data processing with meta context
- Performance scoring (1-10)
- Detailed statistical analysis
- Meta-aware benchmarking
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/analyze/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```
**Optional Body Parameters**:
```json
{
  "analysisType": "performance"
}
```

### Champion Recommendations
**Endpoint**: `POST /api/ai/champions/:region/:summonerName`
**Status**: ✅ Working (Bug Fixed)
**Features**:
- Meta-informed champion pool analysis
- Champion tier positioning
- Build optimization recommendations
- Patch-specific context
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/champions/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```

### Coaching Insights
**Endpoint**: `POST /api/ai/coaching/:region/:summonerName`
**Status**: ✅ Working
**Features**:
- Personalized improvement suggestions
- Gameplay pattern analysis
- Skill development recommendations
```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/coaching/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```

## 📊 Response Structure

### Standard AI Response Format
```json
{
  "success": true,
  "analysis": {
    "analysis": "Detailed AI-generated text with markdown formatting",
    "insights": ["Key insight 1", "Key insight 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "score": 7.5,
    "timestamp": "2025-06-23T09:43:25.421Z"
  },
  "metadata": {
    "matchesAnalyzed": 10,
    "currentRank": "EMERALD IV",
    "timestamp": "2025-06-23T09:43:25.421Z"
  }
}
```

## 🔧 Testing Commands (PowerShell)

### Complete Test Suite
```powershell
# 1. Health Check
Write-Host "Testing Health Check..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/health"

# 2. AI Validation
Write-Host "Testing AI Validation..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/validate"

# 3. Meta Analysis
Write-Host "Testing Meta Analysis..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/meta-analysis"

# 4. Summoner Data
Write-Host "Testing Summoner Data..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/summoner/la1/GraveMan%23CLN"

# 5. Performance Analysis
Write-Host "Testing Performance Analysis..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/analyze/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'

# 6. Champion Recommendations
Write-Host "Testing Champion Recommendations..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/champions/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'

# 7. Coaching Insights
Write-Host "Testing Coaching Insights..." -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:3002/api/ai/coaching/la1/GraveMan%23CLN" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```

## 🐛 Recent Bug Fixes (June 23, 2025)

### Champion Recommendations Fix
**Issue**: `Cannot read properties of undefined (reading 'map')` error
**Root Cause**: Undefined nested recommendation arrays in AI service
**Solution**: Added comprehensive null/undefined checks and fallback values
**Files Modified**: 
- `backend/src/services/aiService.ts`
- Enhanced `createChampionRecommendationPrompt` method

### Meta-Aware Analysis Enhancement
**Feature**: Enhanced data processing with meta context
**Implementation**: 
- `backend/src/services/enhancedDataProcessor.ts`
- `backend/src/services/metaAnalysisService.ts`
- Current patch context integration
- Champion tier positioning
- Build optimization analysis

### AI Response Formatting
**Feature**: Improved AI response formatting
**Implementation**:
- Markdown formatting support
- Better score extraction patterns
- Section headers and structured output
- Consistent response structure

## 🔒 Security & Rate Limiting

- ✅ CORS enabled for development
- ✅ AI-specific rate limiting implemented
- ✅ Request validation middleware
- ✅ Error handling with sanitized responses
- ✅ Environment variable protection

## 📝 Environment Requirements

```env
# Required Environment Variables
RIOT_API_KEY=your_riot_api_key
AI_API_KEY=your_groq_api_key
AI_API_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lol_analyzer
PORT=3002
NODE_ENV=development
```

## 🎯 Next Steps

1. **Frontend Integration**: Update frontend to consume new AI features
2. **Real-time Updates**: Consider WebSocket for live analysis
3. **Caching**: Implement Redis for performance optimization
4. **Monitoring**: Add performance monitoring and analytics
5. **Production Deploy**: Prepare for production deployment
