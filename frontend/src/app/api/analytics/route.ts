import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wpdeveloper@localhost:5432/bangladesh_news_tracker'
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        // Get basic stats
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT na.id) as total_articles,
                COUNT(DISTINCT al.normalized_name) as unique_locations,
                COUNT(al.id) as total_location_mentions,
                COUNT(DISTINCT ns.id) as active_sources,
                COUNT(CASE WHEN na.ai_processed = true THEN 1 END) as processed_articles
            FROM news_articles na
            LEFT JOIN article_locations al ON na.id = al.article_id
            LEFT JOIN news_sources ns ON na.source_id = ns.id
            WHERE na.published_at >= NOW() - INTERVAL '${days} days'
        `;

        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];

        // Get daily article counts for the chart
        const dailyQuery = `
            SELECT 
                DATE(published_at) as date,
                COUNT(*) as article_count,
                COUNT(CASE WHEN ai_processed = true THEN 1 END) as processed_count
            FROM news_articles
            WHERE published_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(published_at)
            ORDER BY date DESC
        `;

        const dailyResult = await pool.query(dailyQuery);

        // Get top sources
        const sourcesQuery = `
            SELECT 
                ns.name,
                COUNT(na.id) as article_count,
                COUNT(CASE WHEN na.ai_processed = true THEN 1 END) as processed_count
            FROM news_sources ns
            LEFT JOIN news_articles na ON ns.id = na.source_id 
                AND na.published_at >= NOW() - INTERVAL '${days} days'
            GROUP BY ns.id, ns.name
            ORDER BY article_count DESC
            LIMIT 10
        `;

        const sourcesResult = await pool.query(sourcesQuery);

        // Get location trends
        const locationTrendsQuery = `
            WITH current_period AS (
                SELECT 
                    al.normalized_name,
                    COUNT(*) as current_mentions
                FROM article_locations al
                JOIN news_articles na ON al.article_id = na.id
                WHERE na.published_at >= NOW() - INTERVAL '${days} days'
                GROUP BY al.normalized_name
            ),
            previous_period AS (
                SELECT 
                    al.normalized_name,
                    COUNT(*) as previous_mentions
                FROM article_locations al
                JOIN news_articles na ON al.article_id = na.id
                WHERE na.published_at >= NOW() - INTERVAL '${days * 2} days'
                    AND na.published_at < NOW() - INTERVAL '${days} days'
                GROUP BY al.normalized_name
            )
            SELECT 
                COALESCE(c.normalized_name, p.normalized_name) as name,
                COALESCE(c.current_mentions, 0) as current_mentions,
                COALESCE(p.previous_mentions, 0) as previous_mentions,
                CASE 
                    WHEN p.previous_mentions = 0 AND c.current_mentions > 0 THEN 'new'
                    WHEN p.previous_mentions > 0 AND c.current_mentions = 0 THEN 'disappeared'
                    WHEN c.current_mentions > p.previous_mentions THEN 'up'
                    WHEN c.current_mentions < p.previous_mentions THEN 'down'
                    ELSE 'stable'
                END as trend
            FROM current_period c
            FULL OUTER JOIN previous_period p ON c.normalized_name = p.normalized_name
            WHERE COALESCE(c.current_mentions, 0) > 0 OR COALESCE(p.previous_mentions, 0) > 0
            ORDER BY COALESCE(c.current_mentions, 0) DESC
            LIMIT 15
        `;

        const trendsResult = await pool.query(locationTrendsQuery);

        return NextResponse.json({
            stats: {
                total_articles: parseInt(stats.total_articles) || 0,
                unique_locations: parseInt(stats.unique_locations) || 0,
                total_location_mentions: parseInt(stats.total_location_mentions) || 0,
                active_sources: parseInt(stats.active_sources) || 0,
                processed_articles: parseInt(stats.processed_articles) || 0,
                processing_rate: stats.total_articles > 0 
                    ? ((parseInt(stats.processed_articles) / parseInt(stats.total_articles)) * 100).toFixed(1)
                    : '0'
            },
            daily_counts: dailyResult.rows.map(row => ({
                date: row.date,
                articles: parseInt(row.article_count),
                processed: parseInt(row.processed_count)
            })),
            top_sources: sourcesResult.rows.map(row => ({
                name: row.name,
                articles: parseInt(row.article_count) || 0,
                processed: parseInt(row.processed_count) || 0,
                processing_rate: row.article_count > 0 
                    ? ((parseInt(row.processed_count) / parseInt(row.article_count)) * 100).toFixed(1)
                    : '0'
            })),
            location_trends: trendsResult.rows.map(row => ({
                name: row.name,
                current_mentions: parseInt(row.current_mentions) || 0,
                previous_mentions: parseInt(row.previous_mentions) || 0,
                trend: row.trend,
                change: row.previous_mentions > 0 
                    ? (((parseInt(row.current_mentions) - parseInt(row.previous_mentions)) / parseInt(row.previous_mentions)) * 100).toFixed(1)
                    : row.current_mentions > 0 ? '100' : '0'
            }))
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
