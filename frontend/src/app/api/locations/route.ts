import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wpdeveloper@localhost:5432/bangladesh_news_tracker'
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type'); // division, district, city, area
        const includeCoordinates = searchParams.get('coordinates') === 'true';

        let query = `
            SELECT 
                al.normalized_name,
                COUNT(*) as mention_count,
                AVG(CASE 
                    WHEN al.confidence = 'high' THEN 1.0
                    WHEN al.confidence = 'medium' THEN 0.7
                    WHEN al.confidence = 'low' THEN 0.4
                    ELSE 0.5
                END) as avg_confidence,
                MAX(na.published_at) as last_mentioned
        `;

        if (includeCoordinates) {
            query += `,
                ST_X(ST_Centroid(ST_Collect(al.coordinates))) as avg_lng,
                ST_Y(ST_Centroid(ST_Collect(al.coordinates))) as avg_lat
            `;
        }

        query += `
            FROM article_locations al
            JOIN news_articles na ON al.article_id = na.id
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (type) {
            // Join with bd_locations to filter by type
            query = query.replace('FROM article_locations al', 
                'FROM article_locations al LEFT JOIN bd_locations bl ON al.normalized_name = bl.name_en');
            query += ` WHERE bl.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        query += `
            GROUP BY al.normalized_name
            ORDER BY mention_count DESC, last_mentioned DESC
            LIMIT $${paramIndex}
        `;
        params.push(limit);

        const result = await pool.query(query, params);

        const locations = result.rows.map(row => ({
            name: row.normalized_name,
            mentions: parseInt(row.mention_count),
            confidence: parseFloat(row.avg_confidence).toFixed(2),
            last_mentioned: row.last_mentioned,
            coordinates: includeCoordinates && row.avg_lng && row.avg_lat ? {
                lng: parseFloat(row.avg_lng),
                lat: parseFloat(row.avg_lat)
            } : null
        }));

        return NextResponse.json({
            locations,
            total: locations.length
        });

    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch locations' },
            { status: 500 }
        );
    }
}
