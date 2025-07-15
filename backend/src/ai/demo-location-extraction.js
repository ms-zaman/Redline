#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * Demo function that shows what location extraction would look like
 */
async function demoLocationExtraction() {
    try {
        console.log('🎯 Demo: AI Location Extraction for Bangladesh News\n');
        
        // Sample Bangladesh news article
        const sampleArticle = {
            id: 'demo-1',
            title: 'Heavy rainfall causes flooding in Chittagong, traffic disrupted in Dhaka',
            content: `Heavy monsoon rainfall in Chittagong division has caused severe flooding in Cox's Bazar and Bandarban upazilas. The flooding has affected thousands of residents in the coastal areas.

In the capital Dhaka, traffic congestion has worsened due to waterlogging in key areas including Dhanmondi, Gulshan, and Uttara. The Dhaka Metropolitan Police reported that several roads in Old Dhaka are completely submerged.

The situation in Sylhet division is also concerning, with the Surma River crossing the danger level near Sylhet city. Local authorities have evacuated residents from low-lying areas in Sunamganj and Habiganj districts.

Meanwhile, Rajshahi and Khulna divisions have issued flood warnings for areas along the Padma and Rupsha rivers. The Bangladesh Meteorological Department has forecast continued heavy rainfall for the next 48 hours.`,
            url: 'https://example.com/news/flooding-bangladesh',
            published_at: new Date()
        };
        
        console.log('📰 Sample Article:');
        console.log('==================');
        console.log(`Title: ${sampleArticle.title}`);
        console.log(`Content: ${sampleArticle.content.substring(0, 200)}...\n`);
        
        // Mock AI response (what would be returned by OpenAI)
        const mockAIResponse = {
            locations: [
                {
                    extracted_text: "Chittagong division",
                    normalized_name: "Chittagong",
                    type: "division",
                    confidence: 0.95,
                    context: "Heavy monsoon rainfall in Chittagong division has caused severe flooding",
                    coordinates: {
                        lat: 22.5,
                        lng: 91.8,
                        confidence: 0.9
                    },
                    administrative_hierarchy: {
                        division: "Chittagong",
                        district: null,
                        upazila: null
                    }
                },
                {
                    extracted_text: "Cox's Bazar",
                    normalized_name: "Cox's Bazar",
                    type: "district",
                    confidence: 0.92,
                    context: "severe flooding in Cox's Bazar and Bandarban upazilas",
                    coordinates: {
                        lat: 21.4272,
                        lng: 92.0058,
                        confidence: 0.95
                    },
                    administrative_hierarchy: {
                        division: "Chittagong",
                        district: "Cox's Bazar",
                        upazila: null
                    }
                },
                {
                    extracted_text: "Bandarban",
                    normalized_name: "Bandarban",
                    type: "district",
                    confidence: 0.90,
                    context: "severe flooding in Cox's Bazar and Bandarban upazilas",
                    coordinates: {
                        lat: 22.1953,
                        lng: 92.2183,
                        confidence: 0.88
                    },
                    administrative_hierarchy: {
                        division: "Chittagong",
                        district: "Bandarban",
                        upazila: null
                    }
                },
                {
                    extracted_text: "Dhaka",
                    normalized_name: "Dhaka",
                    type: "city",
                    confidence: 0.98,
                    context: "In the capital Dhaka, traffic congestion has worsened",
                    coordinates: {
                        lat: 23.8103,
                        lng: 90.4125,
                        confidence: 0.99
                    },
                    administrative_hierarchy: {
                        division: "Dhaka",
                        district: "Dhaka",
                        upazila: null
                    }
                },
                {
                    extracted_text: "Dhanmondi",
                    normalized_name: "Dhanmondi",
                    type: "area",
                    confidence: 0.85,
                    context: "waterlogging in key areas including Dhanmondi, Gulshan, and Uttara",
                    coordinates: {
                        lat: 23.7461,
                        lng: 90.3742,
                        confidence: 0.92
                    },
                    administrative_hierarchy: {
                        division: "Dhaka",
                        district: "Dhaka",
                        upazila: null
                    }
                },
                {
                    extracted_text: "Gulshan",
                    normalized_name: "Gulshan",
                    type: "area",
                    confidence: 0.87,
                    context: "waterlogging in key areas including Dhanmondi, Gulshan, and Uttara",
                    coordinates: {
                        lat: 23.7925,
                        lng: 90.4078,
                        confidence: 0.90
                    },
                    administrative_hierarchy: {
                        division: "Dhaka",
                        district: "Dhaka",
                        upazila: null
                    }
                },
                {
                    extracted_text: "Sylhet division",
                    normalized_name: "Sylhet",
                    type: "division",
                    confidence: 0.93,
                    context: "The situation in Sylhet division is also concerning",
                    coordinates: {
                        lat: 24.9,
                        lng: 91.9,
                        confidence: 0.85
                    },
                    administrative_hierarchy: {
                        division: "Sylhet",
                        district: null,
                        upazila: null
                    }
                },
                {
                    extracted_text: "Sylhet city",
                    normalized_name: "Sylhet",
                    type: "city",
                    confidence: 0.91,
                    context: "Surma River crossing the danger level near Sylhet city",
                    coordinates: {
                        lat: 24.8949,
                        lng: 91.8687,
                        confidence: 0.94
                    },
                    administrative_hierarchy: {
                        division: "Sylhet",
                        district: "Sylhet",
                        upazila: null
                    }
                }
            ],
            summary: {
                total_locations: 8,
                primary_location: "Chittagong",
                geographic_scope: "national"
            },
            model_version: "gpt-4o-mini",
            processing_time_ms: 2340,
            processed_at: new Date().toISOString()
        };
        
        console.log('🤖 Mock AI Extraction Results:');
        console.log('==============================');
        console.log(`Processing time: ${mockAIResponse.processing_time_ms}ms`);
        console.log(`Total locations found: ${mockAIResponse.locations.length}`);
        console.log(`Primary location: ${mockAIResponse.summary.primary_location}`);
        console.log(`Geographic scope: ${mockAIResponse.summary.geographic_scope}\n`);
        
        console.log('🗺️  Extracted Locations:');
        console.log('========================');
        mockAIResponse.locations.forEach((location, index) => {
            console.log(`${index + 1}. ${location.normalized_name} (${location.type})`);
            console.log(`   📍 Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`);
            console.log(`   🎯 Confidence: ${(location.confidence * 100).toFixed(1)}%`);
            console.log(`   📝 Context: "${location.context}"`);
            if (location.administrative_hierarchy.division) {
                console.log(`   🏛️  Division: ${location.administrative_hierarchy.division}`);
            }
            console.log('');
        });
        
        console.log('💾 Database Integration:');
        console.log('========================');
        console.log('With a real OpenAI API key, this system would:');
        console.log('✅ Extract locations from news articles automatically');
        console.log('✅ Store location data with coordinates in PostGIS');
        console.log('✅ Link locations to administrative boundaries');
        console.log('✅ Enable geographic queries and mapping');
        console.log('✅ Track location mentions over time');
        console.log('✅ Provide sentiment analysis by location\n');
        
        // Show what the database queries would look like
        console.log('🔍 Example Queries You Could Run:');
        console.log('=================================');
        console.log('1. Find all news mentioning Dhaka in the last week:');
        console.log('   SELECT * FROM news_articles na');
        console.log('   JOIN article_locations al ON na.id = al.article_id');
        console.log('   WHERE al.normalized_name = \'Dhaka\' AND na.published_at > NOW() - INTERVAL \'7 days\';');
        console.log('');
        console.log('2. Find news within 50km of Chittagong:');
        console.log('   SELECT * FROM article_locations');
        console.log('   WHERE ST_DWithin(coordinates, ST_Point(91.8, 22.5), 50000);');
        console.log('');
        console.log('3. Get location mention trends:');
        console.log('   SELECT normalized_name, COUNT(*) as mentions');
        console.log('   FROM article_locations');
        console.log('   GROUP BY normalized_name ORDER BY mentions DESC;');
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        await pool.end();
        console.log('\n✅ Demo completed');
    }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    demoLocationExtraction();
}

export default demoLocationExtraction;
