import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wpdeveloper@localhost:5432/bangladesh_news_tracker'
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const source = searchParams.get('source');

        let query = `
            SELECT 
                na.id,
                na.title,
                na.content,
                na.url,
                na.published_at,
                na.scraped_at,
                na.author,
                na.ai_processed,
                ns.name as source_name,
                COUNT(al.id) as locations_count
            FROM news_articles na
            LEFT JOIN news_sources ns ON na.source_id = ns.id
            LEFT JOIN article_locations al ON na.id = al.article_id
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (source) {
            query += ` WHERE ns.name = $${paramIndex}`;
            params.push(source);
            paramIndex++;
        }

        query += `
            GROUP BY na.id, ns.name
            ORDER BY na.published_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) FROM news_articles na LEFT JOIN news_sources ns ON na.source_id = ns.id';
        const countParams: any[] = [];
        
        if (source) {
            countQuery += ' WHERE ns.name = $1';
            countParams.push(source);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        return NextResponse.json({
            articles: result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content?.substring(0, 300) + '...', // Truncate for list view
                url: row.url,
                published_at: row.published_at,
                scraped_at: row.scraped_at,
                author: row.author,
                source: row.source_name,
                ai_processed: row.ai_processed,
                locations_count: parseInt(row.locations_count) || 0
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });

    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch articles' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, url, published_at, source_id, author } = body;

        if (!title || !url || !source_id) {
            return NextResponse.json(
                { error: 'Missing required fields: title, url, source_id' },
                { status: 400 }
            );
        }

        const query = `
            INSERT INTO news_articles (title, content, url, published_at, source_id, author)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, title, url, published_at, scraped_at
        `;

        const result = await pool.query(query, [
            title,
            content,
            url,
            published_at || new Date(),
            source_id,
            author
        ]);

        return NextResponse.json({
            message: 'Article created successfully',
            article: result.rows[0]
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json(
            { error: 'Failed to create article' },
            { status: 500 }
        );
    }
}
