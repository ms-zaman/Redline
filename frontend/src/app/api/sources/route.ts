import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wpdeveloper@localhost:5432/bangladesh_news_tracker'
});

export async function GET(request: NextRequest) {
    try {
        const query = `
            SELECT 
                ns.id,
                ns.name,
                ns.base_url,
                ns.language,
                ns.is_active,
                ns.created_at,
                COUNT(na.id) as total_articles,
                COUNT(CASE WHEN na.published_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as articles_today,
                COUNT(CASE WHEN na.published_at >= NOW() - INTERVAL '7 days' THEN 1 END) as articles_week,
                COUNT(CASE WHEN na.ai_processed = true THEN 1 END) as processed_articles,
                MAX(na.published_at) as last_article_date
            FROM news_sources ns
            LEFT JOIN news_articles na ON ns.id = na.source_id
            GROUP BY ns.id, ns.name, ns.base_url, ns.language, ns.is_active, ns.created_at
            ORDER BY ns.name
        `;

        const result = await pool.query(query);

        const sources = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            base_url: row.base_url,
            language: row.language,
            is_active: row.is_active,
            created_at: row.created_at,
            stats: {
                total_articles: parseInt(row.total_articles) || 0,
                articles_today: parseInt(row.articles_today) || 0,
                articles_week: parseInt(row.articles_week) || 0,
                processed_articles: parseInt(row.processed_articles) || 0,
                processing_rate: row.total_articles > 0 
                    ? ((parseInt(row.processed_articles) / parseInt(row.total_articles)) * 100).toFixed(1)
                    : '0',
                last_article_date: row.last_article_date
            }
        }));

        return NextResponse.json({
            sources,
            total: sources.length
        });

    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sources' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, base_url, language, scraping_config } = body;

        if (!name || !base_url) {
            return NextResponse.json(
                { error: 'Missing required fields: name, base_url' },
                { status: 400 }
            );
        }

        const query = `
            INSERT INTO news_sources (name, base_url, language, scraping_config)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, base_url, language, is_active, created_at
        `;

        const result = await pool.query(query, [
            name,
            base_url,
            language || 'en',
            scraping_config ? JSON.stringify(scraping_config) : null
        ]);

        return NextResponse.json({
            message: 'News source created successfully',
            source: result.rows[0]
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating source:', error);
        return NextResponse.json(
            { error: 'Failed to create source' },
            { status: 500 }
        );
    }
}
