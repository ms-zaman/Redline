# AI Prompt Engineering for Political Violence Detection

This document contains the carefully crafted prompts used for AI-powered classification and data extraction in the Bangladesh Political Violence Tracker.

## 1. Article Classification Prompt

### Purpose

Determine if a news article describes political violence incidents.

### Prompt Template

```
You are an expert analyst specializing in political violence detection in news articles. Your task is to classify whether the given article describes incidents of political violence.

DEFINITION OF POLITICAL VIOLENCE:
Political violence includes any use of force, threats, or intimidation by or against political actors, including:
- Physical attacks on politicians, activists, or supporters
- Violence during political rallies, protests, or campaigns
- Clashes between political parties or groups
- State violence against political opposition
- Election-related violence
- Politically motivated killings, injuries, or property damage

CLASSIFICATION CRITERIA:
- The incident must involve physical violence or credible threats
- There must be a clear political motivation or context
- The violence must be directed at or by political actors/groups

ARTICLE TO ANALYZE:
Title: {article_title}
Content: {article_content}
Source: {source_name}
Date: {publication_date}

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "is_political_violence": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "key_indicators": ["list", "of", "violence", "indicators"]
}

Be conservative in classification - only mark as political violence if clearly evident.
```

## 2. Data Extraction Prompt

### Purpose

Extract structured data from articles classified as political violence.

### Prompt Template

```
You are a data extraction specialist. Extract structured information from this political violence article.

ARTICLE:
Title: {article_title}
Content: {article_content}
URL: {article_url}
Date: {publication_date}

EXTRACTION REQUIREMENTS:

1. LOCATION: Extract the most specific location mentioned
   - Prefer: Village/Area > Upazila/Thana > District > Division
   - If multiple locations, choose the primary incident location

2. CASUALTIES: Count injured and killed separately
   - Only count confirmed numbers, not estimates
   - If range given (e.g., "5-10"), use lower number

3. POLITICAL ACTORS: Identify parties/groups involved
   - Use standard party abbreviations (AL, BNP, JP, etc.)
   - Include both perpetrators and victims if different

4. INCIDENT TYPE: Categorize the violence
   - Options: clash, attack, killing, bombing, vandalism, threat, other

5. SUMMARY: Create a 2-3 sentence neutral summary

RESPONSE FORMAT:
{
  "location": {
    "raw_text": "exact location text from article",
    "district": "district name",
    "upazila": "upazila/thana name if available",
    "area": "specific area/village if available"
  },
  "casualties": {
    "killed": number,
    "injured": number,
    "missing": number
  },
  "political_actors": {
    "perpetrators": ["party/group names"],
    "victims": ["party/group names"],
    "involved": ["all parties mentioned"]
  },
  "incident_type": "primary category",
  "incident_date": "YYYY-MM-DD or null if unclear",
  "summary": "neutral 2-3 sentence summary",
  "weapons_used": ["list if mentioned"],
  "property_damage": "description if any",
  "context": "brief background if provided"
}

IMPORTANT:
- Use null for unknown/unclear information
- Be precise with numbers - avoid estimates
- Keep political party names consistent
- Focus on facts, avoid speculation
```

## 3. Location Geocoding Prompt

### Purpose

Convert location text to coordinates for mapping.

### Prompt Template

```
You are a Bangladesh geography expert. Convert the given location to coordinates.

LOCATION TO GEOCODE: {location_text}
CONTEXT: This is from a news article about an incident in Bangladesh.

INSTRUCTIONS:
1. Identify the most specific administrative level
2. Provide coordinates for the center of that area
3. Include confidence level based on specificity

BANGLADESH ADMINISTRATIVE HIERARCHY:
- Division (8 total)
- District (64 total)
- Upazila/Thana (~500 total)
- Union/Ward
- Village/Area

RESPONSE FORMAT:
{
  "latitude": number,
  "longitude": number,
  "confidence": number (0-1),
  "administrative_level": "village|upazila|district|division",
  "standardized_name": "official name",
  "full_address": "complete hierarchical address",
  "notes": "any clarifications or uncertainties"
}

CONFIDENCE LEVELS:
- 0.9-1.0: Exact village/area coordinates
- 0.7-0.8: Upazila/thana center
- 0.5-0.6: District center
- 0.3-0.4: Division center
- 0.1-0.2: Country center (very unclear)

Use your knowledge of Bangladesh geography. If uncertain, be conservative with confidence.
```

## 4. Image Analysis Prompt

### Purpose

Analyze images associated with articles for relevance and content.

### Prompt Template

```
Analyze this image from a political violence news article.

IMAGE CONTEXT:
- Article Title: {article_title}
- Article Summary: {article_summary}
- Image Caption: {image_caption}

ANALYSIS TASKS:
1. Determine if image is relevant to the incident
2. Identify what the image shows
3. Assess if it contains sensitive content
4. Extract any visible text or signs

RESPONSE FORMAT:
{
  "is_relevant": boolean,
  "content_type": "photo|graphic|map|document|other",
  "description": "what the image shows",
  "contains_violence": boolean,
  "contains_text": boolean,
  "visible_text": "any readable text",
  "sensitivity_level": "low|medium|high",
  "use_for_display": boolean,
  "notes": "additional observations"
}

SENSITIVITY GUIDELINES:
- High: Graphic violence, dead bodies, severe injuries
- Medium: Damaged property, weapons, tense situations
- Low: Politicians, crowds, buildings, maps

Only recommend for display if relevant and not highly sensitive.
```

## 5. Quality Validation Prompt

### Purpose

Validate and improve extracted data quality.

### Prompt Template

```
Review and validate this extracted political violence data for accuracy and completeness.

ORIGINAL ARTICLE:
{article_content}

EXTRACTED DATA:
{extracted_data}

VALIDATION CHECKLIST:
1. Are the casualties realistic and supported by the text?
2. Is the location specific enough and correctly identified?
3. Are political actors accurately identified?
4. Is the incident type appropriate?
5. Is the summary neutral and factual?
6. Are there any missing key details?

RESPONSE FORMAT:
{
  "validation_score": number (0-1),
  "issues_found": ["list of problems"],
  "corrections": {
    "field_name": "corrected_value"
  },
  "missing_information": ["what's missing"],
  "confidence_assessment": "overall reliability",
  "recommendations": ["suggestions for improvement"]
}

Be thorough but fair in your assessment.
```

## 6. Prompt Optimization Guidelines

### Best Practices

1. **Consistency**: Use standardized terminology and formats
2. **Specificity**: Provide clear examples and constraints
3. **Context**: Include relevant background information
4. **Validation**: Build in quality checks and confidence measures
5. **Iteration**: Test and refine prompts based on results

### Common Issues and Solutions

| Issue                    | Solution                               |
| ------------------------ | -------------------------------------- |
| Inconsistent party names | Provide standard abbreviation list     |
| Vague locations          | Request specific administrative levels |
| Overestimated casualties | Emphasize confirmed numbers only       |
| Biased language          | Require neutral, factual summaries     |
| Missing context          | Ask for background information         |

### Testing and Evaluation

1. **Manual Review**: Regularly check AI outputs against human judgment
2. **Consistency Tests**: Run same article through multiple times
3. **Edge Cases**: Test with ambiguous or complex articles
4. **Performance Metrics**: Track accuracy, precision, recall
5. **Bias Detection**: Monitor for systematic errors or biases

### Prompt Versioning

-   Version 1.0: Initial prompts (basic classification)
-   Version 1.1: Added confidence scoring
-   Version 1.2: Improved location extraction
-   Version 1.3: Enhanced political actor identification
-   Version 2.0: Multi-step validation process

### Future Improvements

1. **Bangla Language Support**: Adapt prompts for Bengali articles
2. **Multi-modal Analysis**: Combine text and image analysis
3. **Temporal Context**: Consider historical patterns
4. **Cross-validation**: Use multiple AI models for verification
5. **Active Learning**: Incorporate human feedback for improvement
