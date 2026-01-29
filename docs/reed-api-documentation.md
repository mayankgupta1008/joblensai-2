# Reed.co.uk Jobs API Documentation

API documentation for integrating Reed.co.uk job listings into JobLensAI.

## Overview

- **Base URL:** `https://www.reed.co.uk/api/1.0/`
- **Coverage:** UK jobs only
- **Rate Limit:** Not publicly documented (be reasonable)
- **Response Format:** JSON

---

## Testing in Postman (Step-by-Step)

### Step 1: Create New Request
1. Open Postman
2. Click **New** → **HTTP Request**
3. Set method to **GET**

### Step 2: Enter the Full URL
```
https://www.reed.co.uk/api/1.0/search?keywords=software%20developer&locationName=london
```

### Step 3: Configure Basic Authentication
1. Go to the **Authorization** tab
2. Select **Type:** `Basic Auth` from dropdown
3. Fill in:

| Field | What to Enter |
|-------|---------------|
| **Username** | `your-api-key-here` (paste your Reed API key) |
| **Password** | *(leave this completely empty)* |

```
┌─────────────────────────────────────────────────────────────────┐
│ Authorization                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Type: [Basic Auth ▼]                                            │
│                                                                 │
│ Username: [ a]  ← YOUR REED API KEY GOES HERE │
│                                                                 │
│ Password: [                                  ]  ← LEAVE EMPTY   │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Send Request
Click **Send** button. You should receive a JSON response with job listings.

### Step 5: Try Different Searches

**Remote React jobs:**
```
https://www.reed.co.uk/api/1.0/search?keywords=react%20developer&locationName=remote
```

**Full-time Python jobs in Manchester with salary filter:**
```
https://www.reed.co.uk/api/1.0/search?keywords=python&locationName=manchester&fullTime=true&minimumSalary=40000
```

**Graduate jobs:**
```
https://www.reed.co.uk/api/1.0/search?keywords=software%20engineer&graduate=true&resultsToTake=20
```

### Step 6: Get Job Details
To get full details for a specific job, use the `jobId` from search results:
```
https://www.reed.co.uk/api/1.0/jobs/52437891
```
Replace `52437891` with an actual job ID from your search results.

---

## Authentication

Reed API uses **Basic Authentication**.

| Field | Value |
|-------|-------|
| Username | Your API key |
| Password | Leave empty |

### Example (cURL)

```bash
curl -u "YOUR_API_KEY:" "https://www.reed.co.uk/api/1.0/search?keywords=developer"
```

### Example (JavaScript/Fetch)

```javascript
const API_KEY = 'your-api-key';

const response = await fetch(
  'https://www.reed.co.uk/api/1.0/search?keywords=developer&locationName=london',
  {
    headers: {
      'Authorization': 'Basic ' + btoa(API_KEY + ':')
    }
  }
);

const data = await response.json();
```

### Example (Node.js/Axios)

```javascript
const axios = require('axios');

const API_KEY = 'your-api-key';

const response = await axios.get('https://www.reed.co.uk/api/1.0/search', {
  params: {
    keywords: 'software developer',
    locationName: 'london',
    fullTime: true
  },
  auth: {
    username: API_KEY,
    password: ''
  }
});

console.log(response.data);
```

---

## Endpoints

### 1. Search Jobs

**Endpoint:** `GET /search`

**Full URL:** `https://www.reed.co.uk/api/1.0/search`

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `keywords` | string | Search terms (job title, skills, etc.) | - |
| `locationName` | string | Location (city, region, postcode) | - |
| `distanceFromLocation` | integer | Radius in miles from location | 10 |
| `permanent` | boolean | Include permanent jobs | - |
| `contract` | boolean | Include contract jobs | - |
| `temp` | boolean | Include temporary jobs | - |
| `fullTime` | boolean | Include full-time jobs | - |
| `partTime` | boolean | Include part-time jobs | - |
| `minimumSalary` | integer | Minimum salary (annual, GBP) | - |
| `maximumSalary` | integer | Maximum salary (annual, GBP) | - |
| `postedByRecruitmentAgency` | boolean | Jobs from agencies | - |
| `postedByDirectEmployer` | boolean | Jobs from direct employers | - |
| `graduate` | boolean | Graduate-level roles | - |
| `employerId` | integer | Filter by employer ID | - |
| `employerProfileId` | integer | Filter by employer profile ID | - |
| `resultsToTake` | integer | Results per request (max 100) | 100 |
| `resultsToSkip` | integer | Offset for pagination | 0 |

#### Example Request

```
GET https://www.reed.co.uk/api/1.0/search?keywords=react%20developer&locationName=london&fullTime=true&permanent=true&minimumSalary=40000&resultsToTake=25
```

#### Example Response

```json
{
  "results": [
    {
      "jobId": 52437891,
      "employerId": 12345,
      "employerName": "Tech Solutions Ltd",
      "employerProfileId": null,
      "employerProfileName": null,
      "jobTitle": "Senior React Developer",
      "locationName": "London",
      "minimumSalary": 55000,
      "maximumSalary": 70000,
      "currency": "GBP",
      "expirationDate": "2026-02-28",
      "date": "2026-01-28",
      "jobDescription": "We are seeking an experienced React developer...",
      "applications": 12,
      "jobUrl": "https://www.reed.co.uk/jobs/senior-react-developer/52437891"
    }
  ],
  "ambiguousLocations": [],
  "totalResults": 847
}
```

---

### 2. Get Job Details

**Endpoint:** `GET /jobs/{jobId}`

**Full URL:** `https://www.reed.co.uk/api/1.0/jobs/{jobId}`

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | integer | The job ID from search results (required) |

#### Example Request

```
GET https://www.reed.co.uk/api/1.0/jobs/52437891
```

#### Example Response

```json
{
  "employerId": 12345,
  "employerName": "Tech Solutions Ltd",
  "jobId": 52437891,
  "jobTitle": "Senior React Developer",
  "locationName": "London, UK",
  "minimumSalary": 55000,
  "maximumSalary": 70000,
  "currency": "GBP",
  "yearlyMinimumSalary": 55000,
  "yearlyMaximumSalary": 70000,
  "salaryType": "annual",
  "jobDescription": "<p>Full HTML job description...</p>",
  "fullDescription": "Full text description...",
  "contractType": "permanent",
  "jobType": "Full Time",
  "datePosted": "2026-01-28",
  "expirationDate": "2026-02-28",
  "externalUrl": "https://apply.example.com/job/123",
  "jobUrl": "https://www.reed.co.uk/jobs/senior-react-developer/52437891",
  "partTime": false,
  "fullTime": true
}
```

---

## Response Fields Reference

### Search Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | integer | Unique job identifier |
| `employerId` | integer | Employer's ID |
| `employerName` | string | Company name |
| `jobTitle` | string | Job title |
| `locationName` | string | Job location |
| `minimumSalary` | number | Min salary (can be null) |
| `maximumSalary` | number | Max salary (can be null) |
| `currency` | string | Currency code (GBP) |
| `expirationDate` | string | When listing expires |
| `date` | string | Date posted |
| `jobDescription` | string | Short description |
| `applications` | integer | Number of applications |
| `jobUrl` | string | Link to Reed listing |

### Job Details Fields (Additional)

| Field | Type | Description |
|-------|------|-------------|
| `contractType` | string | permanent, contract, temp |
| `jobType` | string | Full Time, Part Time |
| `fullDescription` | string | Complete job description |
| `externalUrl` | string | Direct application URL |
| `salaryType` | string | annual, hourly, daily |

---

## Pagination

Use `resultsToTake` and `resultsToSkip` for pagination:

```javascript
// Page 1 (first 25 results)
/search?keywords=developer&resultsToTake=25&resultsToSkip=0

// Page 2 (next 25 results)
/search?keywords=developer&resultsToTake=25&resultsToSkip=25

// Page 3
/search?keywords=developer&resultsToTake=25&resultsToSkip=50
```

### Pagination Helper

```javascript
function getPaginationParams(page, pageSize = 25) {
  return {
    resultsToTake: pageSize,
    resultsToSkip: (page - 1) * pageSize
  };
}
```

---

## Error Handling

| Status Code | Description | Solution |
|-------------|-------------|----------|
| `401 Unauthorized` | Invalid or missing API key | Check Basic Auth credentials |
| `400 Bad Request` | Invalid parameters | Verify parameter names/values |
| `404 Not Found` | Job ID doesn't exist | Check job ID is valid |
| `429 Too Many Requests` | Rate limit exceeded | Reduce request frequency |

---

## Integration Example for JobLensAI

```typescript
// services/reed-api.ts

import axios, { AxiosInstance } from 'axios';

interface ReedJobSearchParams {
  keywords?: string;
  locationName?: string;
  distanceFromLocation?: number;
  permanent?: boolean;
  contract?: boolean;
  fullTime?: boolean;
  partTime?: boolean;
  minimumSalary?: number;
  maximumSalary?: number;
  graduate?: boolean;
  resultsToTake?: number;
  resultsToSkip?: number;
}

interface ReedJob {
  jobId: number;
  employerId: number;
  employerName: string;
  jobTitle: string;
  locationName: string;
  minimumSalary: number | null;
  maximumSalary: number | null;
  currency: string;
  expirationDate: string;
  date: string;
  jobDescription: string;
  applications: number;
  jobUrl: string;
}

interface ReedSearchResponse {
  results: ReedJob[];
  totalResults: number;
}

class ReedApiService {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://www.reed.co.uk/api/1.0',
      auth: {
        username: apiKey,
        password: ''
      }
    });
  }

  async searchJobs(params: ReedJobSearchParams): Promise<ReedSearchResponse> {
    const response = await this.client.get('/search', { params });
    return response.data;
  }

  async getJobDetails(jobId: number): Promise<ReedJob> {
    const response = await this.client.get(`/jobs/${jobId}`);
    return response.data;
  }
}

export default ReedApiService;
```

### Usage

```typescript
const reedApi = new ReedApiService(process.env.REED_API_KEY!);

// Search for React jobs in London
const jobs = await reedApi.searchJobs({
  keywords: 'react developer',
  locationName: 'london',
  fullTime: true,
  minimumSalary: 40000,
  resultsToTake: 25
});

console.log(`Found ${jobs.totalResults} jobs`);

// Get full details for a job
const jobDetails = await reedApi.getJobDetails(jobs.results[0].jobId);
```

---

## Best Practices

1. **Cache Results** - Job listings don't change frequently; cache for 1-4 hours
2. **Handle Null Salaries** - Some listings don't include salary info
3. **Respect Rate Limits** - Add delays between bulk requests
4. **Store Job IDs** - Track which jobs users have seen/swiped
5. **Parse HTML** - `jobDescription` may contain HTML; sanitize before display

---

## Resources

- [Reed Developer Portal](https://www.reed.co.uk/developers)
- [Jobseeker API Docs](https://www.reed.co.uk/developers/Jobseeker)
- [Get API Key](https://www.reed.co.uk/developers/register)
