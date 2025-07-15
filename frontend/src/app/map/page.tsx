"use client";

import { MapPin, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("../components/MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
            </div>
        </div>
    ),
});

interface LocationData {
    name: string;
    mentions: number;
    coordinates: {
        lat: number;
        lng: number;
    } | null;
    confidence: string;
    last_mentioned: string;
}

export default function MapPage() {
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<LocationData[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [minMentions, setMinMentions] = useState(1);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch(
                    "/api/locations?coordinates=true&limit=100"
                );
                const data = await response.json();

                if (data.locations) {
                    // Add mock coordinates for demonstration since we don't have AI-processed data yet
                    const locationsWithCoords = data.locations.map(
                        (loc: any) => ({
                            ...loc,
                            coordinates:
                                loc.coordinates || getMockCoordinates(loc.name),
                        })
                    );

                    setLocations(locationsWithCoords);
                    setFilteredLocations(locationsWithCoords);
                } else {
                    // Use mock data for demonstration
                    const mockLocations = getMockBangladeshLocations();
                    setLocations(mockLocations);
                    setFilteredLocations(mockLocations);
                }
            } catch (error) {
                console.error("Error fetching locations:", error);
                // Fallback to mock data
                const mockLocations = getMockBangladeshLocations();
                setLocations(mockLocations);
                setFilteredLocations(mockLocations);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    useEffect(() => {
        // Filter locations based on search and mentions
        const filtered = locations.filter((location) => {
            const matchesSearch = location.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesMentions = location.mentions >= minMentions;
            return matchesSearch && matchesMentions;
        });
        setFilteredLocations(filtered);
    }, [searchTerm, minMentions, locations]);

    const getMockCoordinates = (locationName: string) => {
        const coords: { [key: string]: { lat: number; lng: number } } = {
            Dhaka: { lat: 23.8103, lng: 90.4125 },
            Chittagong: { lat: 22.3569, lng: 91.7832 },
            Sylhet: { lat: 24.8949, lng: 91.8687 },
            Rajshahi: { lat: 24.3745, lng: 88.6042 },
            Khulna: { lat: 22.8456, lng: 89.5403 },
            Barisal: { lat: 22.701, lng: 90.3535 },
            Rangpur: { lat: 25.7439, lng: 89.2752 },
            Mymensingh: { lat: 24.7471, lng: 90.4203 },
        };
        return coords[locationName] || { lat: 23.685, lng: 90.3563 }; // Default to Bangladesh center
    };

    const getMockBangladeshLocations = (): LocationData[] => {
        return [
            {
                name: "Dhaka",
                mentions: 45,
                coordinates: { lat: 23.8103, lng: 90.4125 },
                confidence: "0.95",
                last_mentioned: new Date().toISOString(),
            },
            {
                name: "Chittagong",
                mentions: 32,
                coordinates: { lat: 22.3569, lng: 91.7832 },
                confidence: "0.92",
                last_mentioned: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                name: "Sylhet",
                mentions: 18,
                coordinates: { lat: 24.8949, lng: 91.8687 },
                confidence: "0.88",
                last_mentioned: new Date(Date.now() - 7200000).toISOString(),
            },
            {
                name: "Rajshahi",
                mentions: 12,
                coordinates: { lat: 24.3745, lng: 88.6042 },
                confidence: "0.85",
                last_mentioned: new Date(Date.now() - 10800000).toISOString(),
            },
            {
                name: "Khulna",
                mentions: 8,
                coordinates: { lat: 22.8456, lng: 89.5403 },
                confidence: "0.82",
                last_mentioned: new Date(Date.now() - 14400000).toISOString(),
            },
            {
                name: "Barisal",
                mentions: 6,
                coordinates: { lat: 22.701, lng: 90.3535 },
                confidence: "0.78",
                last_mentioned: new Date(Date.now() - 18000000).toISOString(),
            },
        ];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Political Violence Map
                </h1>
                <p className="text-gray-600 mt-2">
                    Interactive map showing political violence incidents across
                    Bangladesh
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Locations
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Mentions
                        </label>
                        <select
                            value={minMentions}
                            onChange={(e) =>
                                setMinMentions(parseInt(e.target.value))
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value={1}>1+ mentions</option>
                            <option value={5}>5+ mentions</option>
                            <option value={10}>10+ mentions</option>
                            <option value={20}>20+ mentions</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <div className="text-sm text-gray-600">
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {filteredLocations.length} locations shown
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-96 md:h-[500px]">
                    <MapComponent locations={filteredLocations} />
                </div>
            </div>

            {/* Location List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Location Details
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredLocations.map((location, index) => (
                        <div
                            key={location.name}
                            className="p-6 hover:bg-gray-50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {location.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {location.mentions} mentions •
                                            Confidence:{" "}
                                            {(
                                                parseFloat(
                                                    location.confidence
                                                ) * 100
                                            ).toFixed(0)}
                                            %
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        Last mentioned:{" "}
                                        {new Date(
                                            location.last_mentioned
                                        ).toLocaleDateString()}
                                    </p>
                                    {location.coordinates && (
                                        <p className="text-xs text-gray-400">
                                            {location.coordinates.lat.toFixed(
                                                4
                                            )}
                                            ,{" "}
                                            {location.coordinates.lng.toFixed(
                                                4
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
