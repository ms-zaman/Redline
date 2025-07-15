"use client";

import {
    Activity,
    Clock,
    MapPin,
    Newspaper,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface AnalyticsData {
    stats: {
        total_articles: number;
        unique_locations: number;
        total_location_mentions: number;
        active_sources: number;
        processed_articles: number;
        processing_rate: string;
    };
    daily_counts: Array<{
        date: string;
        articles: number;
        processed: number;
    }>;
    top_sources: Array<{
        name: string;
        articles: number;
        processed: number;
        processing_rate: string;
    }>;
    location_trends: Array<{
        name: string;
        current_mentions: number;
        previous_mentions: number;
        trend: string;
        change: string;
    }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(7);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch(
                    `/api/analytics?days=${timeRange}`
                );
                const analyticsData = await response.json();
                setData(analyticsData);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                // Mock data for demonstration
                setData({
                    stats: {
                        total_articles: 6,
                        unique_locations: 0,
                        total_location_mentions: 0,
                        active_sources: 1,
                        processed_articles: 0,
                        processing_rate: "0.0",
                    },
                    daily_counts: [
                        { date: "2025-07-15", articles: 6, processed: 0 },
                    ],
                    top_sources: [
                        {
                            name: "The Daily Star",
                            articles: 6,
                            processed: 0,
                            processing_rate: "0.0",
                        },
                    ],
                    location_trends: [],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed"];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Failed to load analytics data</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Violence Analytics
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Comprehensive insights into political violence patterns
                        and AI classification
                    </p>
                </div>
                <div>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(parseInt(e.target.value))}
                        className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value={1}>Last 24 hours</option>
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Newspaper className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Total Articles
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.stats.total_articles}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <MapPin className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Unique Locations
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.stats.unique_locations}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Activity className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Active Sources
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.stats.active_sources}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Processing Rate
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.stats.processing_rate}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Articles Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Daily Article Count
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.daily_counts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString()
                                }
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) =>
                                    new Date(value).toLocaleDateString()
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="articles"
                                stroke="#2563eb"
                                strokeWidth={2}
                                name="Articles"
                            />
                            <Line
                                type="monotone"
                                dataKey="processed"
                                stroke="#059669"
                                strokeWidth={2}
                                name="Processed"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Sources Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Articles by Source
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.top_sources}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="articles"
                                fill="#2563eb"
                                name="Total Articles"
                            />
                            <Bar
                                dataKey="processed"
                                fill="#059669"
                                name="Processed"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Location Trends and Source Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Location Trends */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Location Trends
                        </h3>
                    </div>
                    <div className="p-6">
                        {data.location_trends.length > 0 ? (
                            <div className="space-y-4">
                                {data.location_trends
                                    .slice(0, 10)
                                    .map((location) => (
                                        <div
                                            key={location.name}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <MapPin className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {location.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {
                                                            location.current_mentions
                                                        }{" "}
                                                        mentions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                {location.trend === "up" && (
                                                    <div className="flex items-center text-green-600">
                                                        <TrendingUp className="h-4 w-4 mr-1" />
                                                        <span className="text-sm">
                                                            +{location.change}%
                                                        </span>
                                                    </div>
                                                )}
                                                {location.trend === "down" && (
                                                    <div className="flex items-center text-red-600">
                                                        <TrendingDown className="h-4 w-4 mr-1" />
                                                        <span className="text-sm">
                                                            {location.change}%
                                                        </span>
                                                    </div>
                                                )}
                                                {location.trend ===
                                                    "stable" && (
                                                    <div className="flex items-center text-gray-500">
                                                        <div className="h-4 w-4 bg-gray-400 rounded-full mr-1"></div>
                                                        <span className="text-sm">
                                                            Stable
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    No location data available yet
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Process articles with AI to see location
                                    trends
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Source Performance */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Source Performance
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {data.top_sources.map((source, index) => (
                                <div
                                    key={source.name}
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
                                                {source.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {source.articles} articles •{" "}
                                                {source.processing_rate}%
                                                processed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${source.processing_rate}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Processing Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    AI Processing Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {data.stats.total_articles}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Articles
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                            {data.stats.processed_articles}
                        </div>
                        <div className="text-sm text-gray-600">Processed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                            {data.stats.total_articles -
                                data.stats.processed_articles}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                </div>

                {data.stats.processed_articles === 0 &&
                    data.stats.total_articles > 0 && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                        AI Processing Pending
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Add OpenAI credits to start processing
                                        articles for location extraction and
                                        analysis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}
