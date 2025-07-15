-- Initial data for Bangladesh News Tracker

-- Insert major Bangladeshi news sources
INSERT INTO news_sources (name, base_url, language, scraping_config) VALUES
('Prothom Alo', 'https://www.prothomalo.com', 'bn', '{"article_selector": ".story-element__content", "title_selector": "h1", "content_selector": ".story-element__content p", "date_selector": ".story-element__time"}'),
('The Daily Star', 'https://www.thedailystar.net', 'en', '{"article_selector": ".article-content", "title_selector": "h1", "content_selector": ".article-content p", "date_selector": ".publish-date"}'),
('Bdnews24.com', 'https://bdnews24.com', 'bn', '{"article_selector": ".details", "title_selector": "h1", "content_selector": ".details p", "date_selector": ".time"}'),
('Jugantor', 'https://www.jugantor.com', 'bn', '{"article_selector": ".news-content", "title_selector": "h1", "content_selector": ".news-content p", "date_selector": ".news-time"}'),
('New Age', 'https://www.newagebd.net', 'en', '{"article_selector": ".content", "title_selector": "h1", "content_selector": ".content p", "date_selector": ".date"}'),
('Kaler Kantho', 'https://www.kalerkantho.com', 'bn', '{"article_selector": ".description", "title_selector": "h1", "content_selector": ".description p", "date_selector": ".time"}'),
('Dhaka Tribune', 'https://www.dhakatribune.com', 'en', '{"article_selector": ".article-body", "title_selector": "h1", "content_selector": ".article-body p", "date_selector": ".publish-time"}'),
('Samakal', 'https://samakal.com', 'bn', '{"article_selector": ".news-details", "title_selector": "h1", "content_selector": ".news-details p", "date_selector": ".news-time"}');

-- Insert Bangladesh administrative divisions (major ones for testing)
-- Divisions
INSERT INTO bd_locations (name, name_en, name_bn, type, geometry, centroid) VALUES
('Dhaka', 'Dhaka', 'ঢাকা', 'division', 
 ST_GeomFromText('MULTIPOLYGON(((90.1 23.5, 90.8 23.5, 90.8 24.2, 90.1 24.2, 90.1 23.5)))', 4326),
 ST_GeomFromText('POINT(90.4 23.8)', 4326)),
('Chittagong', 'Chittagong', 'চট্টগ্রাম', 'division',
 ST_GeomFromText('MULTIPOLYGON(((91.0 21.8, 92.5 21.8, 92.5 23.2, 91.0 23.2, 91.0 21.8)))', 4326),
 ST_GeomFromText('POINT(91.8 22.5)', 4326)),
('Rajshahi', 'Rajshahi', 'রাজশাহী', 'division',
 ST_GeomFromText('MULTIPOLYGON(((88.0 24.0, 89.5 24.0, 89.5 25.5, 88.0 25.5, 88.0 24.0)))', 4326),
 ST_GeomFromText('POINT(88.6 24.7)', 4326)),
('Khulna', 'Khulna', 'খুলনা', 'division',
 ST_GeomFromText('MULTIPOLYGON(((88.5 21.5, 90.0 21.5, 90.0 23.5, 88.5 23.5, 88.5 21.5)))', 4326),
 ST_GeomFromText('POINT(89.2 22.8)', 4326)),
('Sylhet', 'Sylhet', 'সিলেট', 'division',
 ST_GeomFromText('MULTIPOLYGON(((90.8 24.0, 92.5 24.0, 92.5 25.5, 90.8 25.5, 90.8 24.0)))', 4326),
 ST_GeomFromText('POINT(91.9 24.9)', 4326)),
('Barisal', 'Barisal', 'বরিশাল', 'division',
 ST_GeomFromText('MULTIPOLYGON(((89.5 21.8, 91.0 21.8, 91.0 23.2, 89.5 23.2, 89.5 21.8)))', 4326),
 ST_GeomFromText('POINT(90.4 22.7)', 4326)),
('Rangpur', 'Rangpur', 'রংপুর', 'division',
 ST_GeomFromText('MULTIPOLYGON(((88.5 25.0, 90.0 25.0, 90.0 26.5, 88.5 26.5, 88.5 25.0)))', 4326),
 ST_GeomFromText('POINT(89.2 25.7)', 4326)),
('Mymensingh', 'Mymensingh', 'ময়মনসিংহ', 'division',
 ST_GeomFromText('MULTIPOLYGON(((89.8 24.2, 91.2 24.2, 91.2 25.5, 89.8 25.5, 89.8 24.2)))', 4326),
 ST_GeomFromText('POINT(90.4 24.8)', 4326));

-- Major cities/districts
INSERT INTO bd_locations (name, name_en, name_bn, type, parent_id, geometry, centroid) VALUES
('Dhaka City', 'Dhaka', 'ঢাকা', 'city', 
 (SELECT id FROM bd_locations WHERE name_en = 'Dhaka' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((90.3 23.7, 90.5 23.7, 90.5 23.9, 90.3 23.9, 90.3 23.7)))', 4326),
 ST_GeomFromText('POINT(90.4 23.8)', 4326)),
('Chittagong City', 'Chittagong', 'চট্টগ্রাম', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Chittagong' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((91.7 22.2, 91.9 22.2, 91.9 22.4, 91.7 22.4, 91.7 22.2)))', 4326),
 ST_GeomFromText('POINT(91.8 22.3)', 4326)),
('Sylhet City', 'Sylhet', 'সিলেট', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Sylhet' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((91.8 24.8, 92.0 24.8, 92.0 25.0, 91.8 25.0, 91.8 24.8)))', 4326),
 ST_GeomFromText('POINT(91.9 24.9)', 4326)),
('Rajshahi City', 'Rajshahi', 'রাজশাহী', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Rajshahi' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((88.5 24.3, 88.7 24.3, 88.7 24.4, 88.5 24.4, 88.5 24.3)))', 4326),
 ST_GeomFromText('POINT(88.6 24.4)', 4326)),
('Khulna City', 'Khulna', 'খুলনা', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Khulna' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((89.5 22.8, 89.6 22.8, 89.6 22.9, 89.5 22.9, 89.5 22.8)))', 4326),
 ST_GeomFromText('POINT(89.5 22.8)', 4326)),
('Barisal City', 'Barisal', 'বরিশাল', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Barisal' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((90.3 22.7, 90.4 22.7, 90.4 22.8, 90.3 22.8, 90.3 22.7)))', 4326),
 ST_GeomFromText('POINT(90.4 22.7)', 4326)),
('Rangpur City', 'Rangpur', 'রংপুর', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Rangpur' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((89.2 25.7, 89.3 25.7, 89.3 25.8, 89.2 25.8, 89.2 25.7)))', 4326),
 ST_GeomFromText('POINT(89.2 25.7)', 4326)),
('Mymensingh City', 'Mymensingh', 'ময়মনসিংহ', 'city',
 (SELECT id FROM bd_locations WHERE name_en = 'Mymensingh' AND type = 'division'),
 ST_GeomFromText('MULTIPOLYGON(((90.4 24.7, 90.5 24.7, 90.5 24.8, 90.4 24.8, 90.4 24.7)))', 4326),
 ST_GeomFromText('POINT(90.4 24.8)', 4326));

-- Important areas within Dhaka
INSERT INTO bd_locations (name, name_en, name_bn, type, parent_id, geometry, centroid) VALUES
('Dhanmondi', 'Dhanmondi', 'ধানমন্ডি', 'area',
 (SELECT id FROM bd_locations WHERE name_en = 'Dhaka' AND type = 'city'),
 ST_GeomFromText('MULTIPOLYGON(((90.37 23.74, 90.39 23.74, 90.39 23.76, 90.37 23.76, 90.37 23.74)))', 4326),
 ST_GeomFromText('POINT(90.38 23.75)', 4326)),
('Gulshan', 'Gulshan', 'গুলশান', 'area',
 (SELECT id FROM bd_locations WHERE name_en = 'Dhaka' AND type = 'city'),
 ST_GeomFromText('MULTIPOLYGON(((90.40 23.78, 90.42 23.78, 90.42 23.80, 90.40 23.80, 90.40 23.78)))', 4326),
 ST_GeomFromText('POINT(90.41 23.79)', 4326)),
('Old Dhaka', 'Old Dhaka', 'পুরান ঢাকা', 'area',
 (SELECT id FROM bd_locations WHERE name_en = 'Dhaka' AND type = 'city'),
 ST_GeomFromText('MULTIPOLYGON(((90.39 23.70, 90.42 23.70, 90.42 23.73, 90.39 23.73, 90.39 23.70)))', 4326),
 ST_GeomFromText('POINT(90.40 23.71)', 4326)),
('Uttara', 'Uttara', 'উত্তরা', 'area',
 (SELECT id FROM bd_locations WHERE name_en = 'Dhaka' AND type = 'city'),
 ST_GeomFromText('MULTIPOLYGON(((90.38 23.86, 90.40 23.86, 90.40 23.88, 90.38 23.88, 90.38 23.86)))', 4326),
 ST_GeomFromText('POINT(90.39 23.87)', 4326));
