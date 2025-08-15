# Pharmaceutical SEO Content Generation Prompts

## Overview

This document contains the complete AI prompts used by the 3Cubed Pharmaceutical SEO Platform to generate stage-specific, audience-targeted content for prescription drugs across four development stages.

## Audience Context

All prompts are dynamically adjusted based on target audience:

**Healthcare Professionals (HCP):**
- Use medical terminology, clinical data, and professional language
- Focus on prescribing information and clinical efficacy
- Include detailed clinical information

**Patients:**
- Use clear, accessible language avoiding complex medical jargon
- Focus on patient benefits and quality of life
- Emphasize that this is a prescription medication

## Development Stages & Content Strategy

### STAGE 1: MARKET SHAPING
**Goal:** Disease education without brand promotion to create market awareness

### STAGE 2: PHASE III CLINICAL TRIAL  
**Goal:** Pre-launch clinical focus emphasizing trial data and regulatory pathway

### STAGE 3: MARKET LAUNCH 1-6 MONTHS
**Goal:** Early adoption focus highlighting NEW availability and FDA approval

### STAGE 4: MARKET LAUNCH 7-12 MONTHS
**Goal:** Established experience focus emphasizing PROVEN efficacy and real-world data

---

# STAGE 1: MARKET SHAPING PROMPT

**Content Type:** Disease Education (Brand-Free)
**Output Fields:** `disease_overview`, `signs_symptoms`, `risk_factors`, `early_diagnosis_importance`

```
Generate DISEASE EDUCATION SEO content for ${submission.indication} in ${submission.therapeutic_area} targeting ${audienceContext}

CRITICAL: This is MARKET SHAPING stage - DO NOT mention ${submission.product_name} or any specific brand names. Focus on DISEASE EDUCATION ONLY.

MARKET SHAPING Goals:
- Raise awareness of ${submission.indication} as a condition
- Highlight treatment gaps and unmet medical needs  
- Educate about signs, symptoms, and risk factors
- Drive physician consultation and proper diagnosis
- Build disease category awareness (not product awareness)
- Create market need before product promotion

Based on examples like ntmfacts.com, yourattentionplease.com, and learnnpc.com, create content that:
1. Educates about the disease without mentioning brands
2. Positions early diagnosis as critical
3. Highlights current diagnostic challenges or treatment gaps
4. Encourages healthcare provider consultation
5. Uses scientific, evidence-based approach
6. Drives disease awareness to "shape the market"

Generate the following DISEASE EDUCATION content for ${submission.indication}:

1. SEO Title (60 chars max) - Disease-focused, no brand names
2. Meta Description (150 chars max) - Disease awareness and consultation CTA
3. H1 Tag - Disease education headline
4. 5 H2 Tags focusing on: disease overview, signs/symptoms, risk factors, diagnosis importance, talking to your doctor
5. 10 SEO Keywords - Disease and condition focused, no brand terms
6. 5 Long-tail Keywords - Disease education queries
7. 3 Voice Search Queries about the condition
8. Disease Overview (explain ${submission.indication} without brand mentions)
9. Signs and Symptoms (what patients/HCPs should watch for)
10. Risk Factors and Diagnostic Challenges
11. Importance of Early Diagnosis and Treatment Discussion

Format as JSON with these exact keys: seo_title, meta_description, h1_tag, h2_tags, seo_keywords, long_tail_keywords, voice_search_queries, disease_overview, signs_symptoms, risk_factors, early_diagnosis_importance
```

---

# STAGE 2: PHASE III CLINICAL TRIAL PROMPT

**Content Type:** Pre-Launch Clinical Focus
**Output Fields:** `clinical_trial_results`, `development_timeline`

```
Generate prescription pharmaceutical SEO content for ${submission.product_name} (${submission.generic_name}) targeting ${audienceContext}

Product Details:
- Indication: ${submission.indication}
- Therapeutic Area: ${submission.therapeutic_area}
- Target Audience: ${submission.target_audience}
- Development Stage: PHASE III CLINICAL TRIAL

CRITICAL FORMATTING REQUIREMENTS:

1. SEO Title Format: MUST follow this exact structure:
   "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
   Example: "Metastatic Breast Cancer | KISQALI® (ribociclib)"

2. Meta Description: 
   - Focus on condition descriptors and clinical development
   - Mention Phase III trials appropriately for ${isHCP ? 'HCPs' : 'patients'}
   - Example: "Learn about ${submission.product_name} Phase III clinical trials for ${submission.indication}. See emerging efficacy data and trial enrollment information."

3. H1 Tag:
   - DO NOT include brand name
   - Focus on treatment/condition only
   - Example: "Advancing treatment for ${submission.indication}: Phase III Clinical Development"

PHASE III CLINICAL TRIAL Focus:
- Emphasize clinical trial data and results
- Highlight efficacy and safety findings
- Discuss upcoming regulatory milestones
- Position as emerging treatment option
- Include trial enrollment and research participation information

Generate the following content tailored for ${submission.target_audience}:

1. SEO Title - MUST follow format: "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
2. Meta Description (150 chars max) - Clinical development focus
3. H1 Tag - NO brand name, clinical development focus
4. 5 H2 Tags for page sections
5. 10 SEO Keywords - Include clinical trial terms
6. 5 Long-tail Keywords - Research and trial focused
7. 3 Voice Search Queries
8. Mechanism of Action (${isHCP ? 'detailed clinical' : 'simplified patient-friendly'})
9. Clinical Trial Results (${isHCP ? 'efficacy endpoints and statistical significance' : 'trial outcomes in patient-friendly language'})
10. Safety Information (${isHCP ? 'adverse events from trials' : 'important safety information from clinical studies'})
11. Development Timeline (${isHCP ? 'regulatory pathway and approval timeline' : 'when this treatment might become available'})

Format as JSON with these exact keys: seo_title, meta_description, h1_tag, h2_tags, seo_keywords, long_tail_keywords, voice_search_queries, mechanism_of_action, clinical_trial_results, safety_information, development_timeline
```

---

# STAGE 3: MARKET LAUNCH 1-6 MONTHS PROMPT

**Content Type:** Early Adoption Focus
**Output Fields:** `access_information`

```
Generate prescription pharmaceutical SEO content for ${submission.product_name} (${submission.generic_name}) targeting ${audienceContext}

Product Details:
- Indication: ${submission.indication}
- Therapeutic Area: ${submission.therapeutic_area}
- Target Audience: ${submission.target_audience}
- Development Stage: MARKET LAUNCH 1-6 MONTHS

CRITICAL FORMATTING REQUIREMENTS:

1. SEO Title Format: MUST follow this exact structure:
   "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
   Example: "Metastatic Breast Cancer | KISQALI® (ribociclib)"

2. Meta Description: 
   - Focus on condition descriptors, NOT clinical trials
   - Emphasize NEW availability and treatment option
   - Example: "Learn about newly available ${submission.product_name} for ${submission.indication} treatment. See prescribing information and patient resources."

3. H1 Tag:
   - DO NOT include brand name
   - Focus on treatment/condition only
   - Example: "New treatment option for ${submission.indication}"

EARLY MARKET LAUNCH Focus (1-6 months):
- Highlight NEW availability and FDA approval
- Emphasize early adoption benefits
- Position as innovative treatment option
- Include access and availability information
- Focus on "now available" messaging
- Address early prescriber adoption

Generate the following content tailored for ${submission.target_audience}:

1. SEO Title - MUST follow format: "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
2. Meta Description (150 chars max) - NEW availability focus, NO clinical trials
3. H1 Tag - NO brand name, new treatment focus
4. 5 H2 Tags for page sections
5. 10 SEO Keywords - Include "new", "available", "FDA approved" terms
6. 5 Long-tail Keywords - Early adoption focused
7. 3 Voice Search Queries
8. Mechanism of Action (${isHCP ? 'detailed clinical' : 'simplified patient-friendly'})
9. Key Benefits (${isHCP ? 'clinical efficacy and differentiation' : 'patient quality of life improvements'})
10. Safety Information (${isHCP ? 'adverse events and contraindications' : 'important prescription safety information'})
11. Access Information (${isHCP ? 'prescribing and formulary details' : 'insurance coverage and patient assistance'})

Format as JSON with these exact keys: seo_title, meta_description, h1_tag, h2_tags, seo_keywords, long_tail_keywords, voice_search_queries, mechanism_of_action, key_benefits, safety_information, access_information
```

---

# STAGE 4: MARKET LAUNCH 7-12 MONTHS PROMPT

**Content Type:** Established Experience Focus
**Output Fields:** `clinical_experience`

```
Generate prescription pharmaceutical SEO content for ${submission.product_name} (${submission.generic_name}) targeting ${audienceContext}

Product Details:
- Indication: ${submission.indication}
- Therapeutic Area: ${submission.therapeutic_area}
- Target Audience: ${submission.target_audience}
- Development Stage: MARKET LAUNCH 7-12 MONTHS

CRITICAL FORMATTING REQUIREMENTS:

1. SEO Title Format: MUST follow this exact structure:
   "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
   Example: "Metastatic Breast Cancer | KISQALI® (ribociclib)"

2. Meta Description: 
   - Focus on condition descriptors, NOT clinical trials
   - Emphasize PROVEN experience and established efficacy
   - Example: "Learn about ${submission.product_name} for ${submission.indication} with proven clinical experience. See established safety profile and prescribing information."

3. H1 Tag:
   - DO NOT include brand name
   - Focus on treatment/condition only
   - Example: "Proven treatment for ${submission.indication} with established efficacy"

ESTABLISHED MARKET LAUNCH Focus (7-12 months):
- Highlight PROVEN clinical experience
- Emphasize established safety and efficacy
- Position as reliable, trusted treatment option
- Include real-world evidence and outcomes
- Focus on "proven" and "established" messaging
- Address widespread prescriber adoption

Generate the following content tailored for ${submission.target_audience}:

1. SEO Title - MUST follow format: "${submission.indication} | ${submission.product_name}® (${submission.generic_name})"
2. Meta Description (150 chars max) - PROVEN experience focus, NO clinical trials
3. H1 Tag - NO brand name, proven treatment focus
4. 5 H2 Tags for page sections
5. 10 SEO Keywords - Include "proven", "established", "experience" terms
6. 5 Long-tail Keywords - Established efficacy focused
7. 3 Voice Search Queries
8. Mechanism of Action (${isHCP ? 'detailed clinical' : 'simplified patient-friendly'})
9. Key Benefits (${isHCP ? 'real-world evidence and outcomes' : 'proven patient quality of life improvements'})
10. Safety Information (${isHCP ? 'established safety profile from real-world use' : 'important prescription safety information'})
11. Clinical Experience (${isHCP ? 'post-marketing surveillance and real-world data' : 'patient success stories and established track record'})

Format as JSON with these exact keys: seo_title, meta_description, h1_tag, h2_tags, seo_keywords, long_tail_keywords, voice_search_queries, mechanism_of_action, key_benefits, safety_information, clinical_experience
```

---

## Critical Formatting Rules

### SEO Title Format (Stages 2-4 Only)
**MUST follow exact structure:**
```
${indication} | ${product_name}® (${generic_name})
```
**Examples:**
- `Metastatic Breast Cancer | KISQALI® (ribociclib)`
- `Rheumatoid Arthritis | HUMIRA® (adalimumab)`

### Meta Description Guidelines
- **NO clinical trials** mentioned (except Phase III stage where appropriate)
- Focus on **condition descriptors**
- Include **treatment context**
- End with **prescribing information** reference

### H1 Tag Requirements
- **NO brand names** in any stage
- Focus on **treatment/condition** only
- Stage-specific messaging:
  - Market Shaping: Disease education focus
  - Phase III: Clinical development focus
  - Launch 1-6 months: New treatment focus
  - Launch 7-12 months: Proven treatment focus

## Database Field Mapping

### All Stages
- `seo_title`
- `meta_description` 
- `h1_tag`
- `h2_tags` (array)
- `seo_keywords` (array)
- `long_tail_keywords` (array)
- `voice_search_queries` (array)
- `mechanism_of_action`
- `safety_information`

### Stage-Specific Fields
- **Market Shaping**: `disease_overview`, `signs_symptoms`, `risk_factors`, `early_diagnosis_importance`
- **Phase III**: `clinical_trial_results`, `development_timeline`
- **Launch 1-6 months**: `key_benefits`, `access_information`
- **Launch 7-12 months**: `key_benefits`, `clinical_experience`

## Implementation Notes

1. **Audience Context** is dynamically inserted based on `target_audience` field
2. **Product variables** are populated from submission data
3. **Stage detection** uses exact string matching on `development_stage` field
4. **Fallback handling** throws error for unrecognized stages
5. **JSON formatting** is strictly enforced with exact key matching

## Usage in Edge Function

```typescript
// Located in: supabase/functions/direct-llm-processor/index.ts
async function generatePharmaceuticalContent(submission: any) {
  const isHCP = submission.target_audience === 'HCP'
  const audienceContext = isHCP ? 'healthcare professionals...' : 'patients and caregivers...'
  
  if (submission.development_stage === 'Market Shaping') {
    // Use Market Shaping prompt
  } else if (submission.development_stage === 'Phase III Clinical Trial') {
    // Use Phase III prompt
  } // ... etc
}
```