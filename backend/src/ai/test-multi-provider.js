#!/usr/bin/env node

import dotenv from 'dotenv';
import { classifyArticleUnified, getProviderStatus } from './unified-classifier.js';

dotenv.config({ path: '../../../.env' });

async function testMultiProvider() {
    try {
        console.log('🤖 Testing Multi-Provider AI Classification...\n');
        
        // Check provider status
        const status = getProviderStatus();
        console.log('📊 Provider Status:');
        console.log('==================');
        console.log(`OpenAI: ${status.openai.configured ? '✅ Configured' : '❌ Not configured'} (${status.openai.model})`);
        console.log(`Gemini: ${status.gemini.configured ? '✅ Configured' : '❌ Not configured'} (${status.gemini.model})`);
        console.log(`Active Provider: ${status.active_provider.toUpperCase()}`);
        console.log('');
        
        if (!status.any_configured) {
            console.log('⚠️  No AI providers configured. Please set one of:');
            console.log('   - OPENAI_API_KEY=sk-your-openai-key');
            console.log('   - GEMINI_API_KEY=your-gemini-key');
            console.log('\nTesting with mock data...\n');
            await testWithMockData();
            return;
        }
        
        // Test with sample articles
        const testArticles = [
            {
                id: 'test-1',
                title: 'Political rally turns violent in Dhaka',
                content: 'A political rally organized by the opposition party in Dhaka turned violent yesterday when clashes erupted between supporters and police. Several activists were injured in the confrontation, and police used tear gas to disperse the crowd. The incident occurred near the National Press Club when protesters attempted to march towards the parliament building.',
                source: 'Test News',
                published_at: new Date().toISOString()
            },
            {
                id: 'test-2',
                title: 'New bridge inaugurated in Chittagong',
                content: 'The Prime Minister inaugurated a new bridge in Chittagong today, connecting two major districts. The infrastructure project, funded by international donors, is expected to boost economic activity in the region. Local officials praised the development as a milestone for regional connectivity.',
                source: 'Test News',
                published_at: new Date().toISOString()
            }
        ];
        
        console.log('🧪 Testing with sample articles...\n');
        
        for (let i = 0; i < testArticles.length; i++) {
            const article = testArticles[i];
            console.log(`📰 Article ${i + 1}: ${article.title}`);
            
            try {
                const result = await classifyArticleUnified(article);
                
                console.log(`🚨 Political Violence: ${result.is_political_violence ? 'YES' : 'NO'}`);
                console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                console.log(`🤖 Provider: ${result.provider || status.active_provider}`);
                console.log(`⏱️  Processing Time: ${result.processing_time_ms}ms`);
                console.log(`💭 Reasoning: ${result.reasoning}`);
                
                if (result.key_indicators && result.key_indicators.length > 0) {
                    console.log(`🔍 Key Indicators: ${result.key_indicators.join(', ')}`);
                }
                
                if (result.violence_type) {
                    console.log(`⚔️  Violence Type: ${result.violence_type}`);
                }
                
            } catch (error) {
                console.log(`❌ Classification failed: ${error.message}`);
            }
            
            console.log('');
            
            // Delay between requests
            if (i < testArticles.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('✅ Multi-provider test completed');
}

async function testWithMockData() {
    console.log('🧪 Mock Classification Results:');
    console.log('==============================');
    
    const mockResults = [
        {
            title: 'Political rally turns violent in Dhaka',
            is_political_violence: true,
            confidence: 0.92,
            reasoning: 'Article describes violent clashes between political protesters and police with injuries',
            provider: 'mock'
        },
        {
            title: 'New bridge inaugurated in Chittagong',
            is_political_violence: false,
            confidence: 0.95,
            reasoning: 'Article describes peaceful infrastructure inauguration with no political violence',
            provider: 'mock'
        }
    ];
    
    mockResults.forEach((result, index) => {
        console.log(`\n📰 Article ${index + 1}: ${result.title}`);
        console.log(`🚨 Political Violence: ${result.is_political_violence ? 'YES' : 'NO'}`);
        console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`🤖 Provider: ${result.provider}`);
        console.log(`💭 Reasoning: ${result.reasoning}`);
    });
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testMultiProvider();
}

export default testMultiProvider;
