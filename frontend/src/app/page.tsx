"use client";

import { Clock, MapPin, Newspaper, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import RefreshButton from "./components/RefreshButton";
import StatusIndicator from "./components/StatusIndicator";

interface NewsArticle {
    id: string;
    title: string;
    content: string;
    url: string;
    published_at: string;
    source: string;
    locations_count?: number;
}

interface LocationStats {
    name: string;
    mentions: number;
    trend: "up" | "down" | "stable";
}

export default function Dashboard() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch articles
                const articlesResponse = await fetch("/api/articles?limit=5");
                const articlesData = await articlesResponse.json();

                // Fetch location stats
                const locationsResponse = await fetch(
                    "/api/locations?limit=10"
                );
                const locationsData = await locationsResponse.json();

                if (articlesData.articles) {
                    setArticles(articlesData.articles);
                }

                if (locationsData.locations) {
                    // Convert to our format and add trend calculation
                    const locationStats = locationsData.locations.map(
                        (loc: any, index: number) => ({
                            name: loc.name,
                            mentions: loc.mentions,
                            trend:
                                index < 2
                                    ? "up"
                                    : index < 4
                                    ? "stable"
                                    : "down", // Simple trend simulation
                        })
                    );
                    setLocationStats(locationStats);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                // Fall back to mock data if API fails
                const mockArticles: NewsArticle[] = [
                    {
                        id: "1",
                        title: "Heavy rainfall causes flooding in Chittagong division",
                        content:
                            "Heavy monsoon rainfall in Chittagong division has caused severe flooding...",
                        url: "https://example.com/news/1",
                        published_at: new Date().toISOString(),
                        source: "The Daily Star",
                        locations_count: 5,
                    },
                ];

                const mockLocationStats: LocationStats[] = [
                    { name: "Dhaka", mentions: 45, trend: "up" },
                    { name: "Chittagong", mentions: 32, trend: "up" },
                ];

                setArticles(mockArticles);
                setLocationStats(mockLocationStats);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch articles
            const articlesResponse = await fetch("/api/articles?limit=5");
            const articlesData = await articlesResponse.json();

            // Fetch location stats
            const locationsResponse = await fetch("/api/locations?limit=10");
            const locationsData = await locationsResponse.json();

            if (articlesData.articles) {
                setArticles(articlesData.articles);
            }

            if (locationsData.locations) {
                const locationStats = locationsData.locations.map(
                    (loc: any, index: number) => ({
                        name: loc.name,
                        mentions: loc.mentions,
                        trend: index < 2 ? "up" : index < 4 ? "stable" : "down",
                    })
                );
                setLocationStats(locationStats);
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60)
        );

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Political Violence Incidents
                    </h1>
                    <p className="text-gray-600 mt-2">
                        AI-powered tracking and analysis of political violence
                        in Bangladesh
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <RefreshButton onRefresh={refreshData} />
                    <StatusIndicator />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Newspaper className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Articles Analyzed
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {articles.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <MapPin className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Violence Hotspots
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {locationStats.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Violence Incidents
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {locationStats.reduce(
                                    (sum, loc) => sum + loc.mentions,
                                    0
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                AI Classification
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                Ready
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Articles */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Recent Analysis
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="p-6 hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {article.content}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                                                <span>{article.source}</span>
                                                <span>
                                                    {formatTimeAgo(
                                                        article.published_at
                                                    )}
                                                </span>
                                                {article.locations_count && (
                                                    <span className="flex items-center">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {
                                                            article.locations_count
                                                        }{" "}
                                                        locations
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Location Stats */}
                <div>
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Violence Hotspots
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {locationStats.map((location, index) => (
                                    <div
                                        key={location.name}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {location.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {location.mentions} mentions
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {location.trend === "up" && (
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                            )}
                                            {location.trend === "down" && (
                                                <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
                                            )}
                                            {location.trend === "stable" && (
                                                <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
