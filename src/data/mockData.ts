export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  priceFormatted: string;
  area: string;
  rooms: string;
  parking: string;
  images: string[];
  isHot?: boolean;
  description: string;
  coordinates: [number, number];
  bedrooms: number;
  bathrooms: number;
  garages: number;
  agent: {
    name: string;
    avatar: string;
    phone: string;
    email: string;
  };
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Spacious 5-Room House",
    location: "New York, NY",
    price: 180000,
    priceFormatted: "$180,000",
    area: "400 sqm",
    rooms: "5, 2 bath",
    parking: "2 garage",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    isHot: true,
    description: "This stunning 400 sqm home offers spacious living in a peaceful neighborhood. With 5 well-sized rooms and modern amenities throughout, it's perfect for families.",
    coordinates: [40.7580, -73.9855],
    bedrooms: 5,
    bathrooms: 2,
    garages: 2,
    agent: {
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent1",
      phone: "+1 (555) 123-4567",
      email: "john.doe@realestate.com"
    }
  },
  {
    id: "2",
    title: "2-Bedroom Apartment",
    location: "New York, NY",
    price: 180000,
    priceFormatted: "$180,000",
    area: "60 m²",
    rooms: "2, 1 bath",
    parking: "1 garage",
    images: ["/placeholder.svg", "/placeholder.svg"],
    isHot: false,
    description: "Modern apartment with beautiful city views. Perfect for young professionals or small families.",
    coordinates: [40.7489, -73.9680],
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    agent: {
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent2",
      phone: "+1 (555) 234-5678",
      email: "sarah.j@realestate.com"
    }
  },
  {
    id: "3",
    title: "Modern Family Home",
    location: "Brooklyn, NY",
    price: 245000,
    priceFormatted: "$245,000",
    area: "85 m²",
    rooms: "3, 2 bath",
    parking: "2 garage",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    isHot: true,
    description: "Contemporary home in a family-friendly neighborhood with excellent schools nearby.",
    coordinates: [40.6782, -73.9442],
    bedrooms: 3,
    bathrooms: 2,
    garages: 2,
    agent: {
      name: "Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent3",
      phone: "+1 (555) 345-6789",
      email: "m.chen@realestate.com"
    }
  },
  {
    id: "4",
    title: "Luxury Penthouse",
    location: "Manhattan, NY",
    price: 520000,
    priceFormatted: "$520,000",
    area: "120 m²",
    rooms: "4, 3 bath",
    parking: "2 garage",
    images: ["/placeholder.svg", "/placeholder.svg"],
    isHot: true,
    description: "Stunning penthouse with panoramic city views and premium finishes throughout.",
    coordinates: [40.7831, -73.9712],
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    agent: {
      name: "Emily Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent4",
      phone: "+1 (555) 456-7890",
      email: "emily.d@realestate.com"
    }
  },
  {
    id: "5",
    title: "Cozy Studio",
    location: "Queens, NY",
    price: 140000,
    priceFormatted: "$140,000",
    area: "35 m²",
    rooms: "1, 1 bath",
    parking: "0 garage",
    images: ["/placeholder.svg"],
    isHot: false,
    description: "Perfect starter home or investment property in an up-and-coming neighborhood.",
    coordinates: [40.7282, -73.7949],
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    agent: {
      name: "David Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent5",
      phone: "+1 (555) 567-8901",
      email: "d.wilson@realestate.com"
    }
  },
  {
    id: "6",
    title: "Garden Villa",
    location: "Staten Island, NY",
    price: 320000,
    priceFormatted: "$320,000",
    area: "200 m²",
    rooms: "4, 3 bath",
    parking: "3 garage",
    images: ["/placeholder.svg", "/placeholder.svg"],
    isHot: false,
    description: "Beautiful villa with large garden and outdoor entertaining area.",
    coordinates: [40.5795, -74.1502],
    bedrooms: 4,
    bathrooms: 3,
    garages: 3,
    agent: {
      name: "Lisa Martinez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent6",
      phone: "+1 (555) 678-9012",
      email: "lisa.m@realestate.com"
    }
  },
  {
    id: "7",
    title: "Downtown Loft",
    location: "Manhattan, NY",
    price: 285000,
    priceFormatted: "$285,000",
    area: "75 m²",
    rooms: "2, 2 bath",
    parking: "1 garage",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    isHot: true,
    description: "Industrial-style loft in the heart of downtown with high ceilings and exposed brick.",
    coordinates: [40.7589, -73.9851],
    bedrooms: 2,
    bathrooms: 2,
    garages: 1,
    agent: {
      name: "Robert Brown",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent7",
      phone: "+1 (555) 789-0123",
      email: "r.brown@realestate.com"
    }
  },
  {
    id: "8",
    title: "Waterfront Condo",
    location: "Brooklyn, NY",
    price: 395000,
    priceFormatted: "$395,000",
    area: "95 m²",
    rooms: "3, 2 bath",
    parking: "1 garage",
    images: ["/placeholder.svg", "/placeholder.svg"],
    isHot: false,
    description: "Stunning waterfront views with modern amenities and easy access to the city.",
    coordinates: [40.6892, -73.9979],
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    agent: {
      name: "Jennifer Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Agent8",
      phone: "+1 (555) 890-1234",
      email: "jennifer.l@realestate.com"
    }
  }
];

export interface MarketData {
  month: string;
  propertiesListed: number;
  propertiesSold: number;
}

export const marketData: MarketData[] = [
  { month: "Sep", propertiesListed: 40, propertiesSold: 45 },
  { month: "Oct", propertiesListed: 45, propertiesSold: 52 },
  { month: "Nov", propertiesListed: 42, propertiesSold: 48 },
  { month: "Dec", propertiesListed: 52, propertiesSold: 60 },
  { month: "Jan", propertiesListed: 48, propertiesSold: 55 },
  { month: "Feb", propertiesListed: 50, propertiesSold: 58 },
  { month: "Mar", propertiesListed: 45, propertiesSold: 50 },
];

export interface PriceRange {
  range: string;
  count: number;
  percentage: number;
}

export const priceRanges: PriceRange[] = [
  { range: "$100k", count: 15, percentage: 25 },
  { range: "$200k", count: 27, percentage: 45 },
  { range: "$300k", count: 39, percentage: 65 },
  { range: "$400k", count: 51, percentage: 85 },
  { range: "$500k", count: 33, percentage: 55 },
  { range: "$600k", count: 21, percentage: 35 },
];

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  location: string;
  phone: string;
  memberSince: string;
}

export const currentUser: UserProfile = {
  name: "Noah Turner",
  email: "noah.turner@email.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  location: "New York, NY",
  phone: "+1 (555) 123-4567",
  memberSince: "January 2023"
};


export const mapLayers = [
  {
    name: "Vibweta",
    url: "/FULL VIBWETA.geojson",
    visible: false,
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 3,
      fillColor: "#dbc5b7",
      fillOpacity: 1
    }
  },
  {
    name: "ParkingB",
    url: "/FULL PARKINGB.geojson",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 3,
      fillColor: "#fafafa",
      fillOpacity: 1
    }
  },
  {
    name: "Roads",
    url: "/FULL ROADS.json",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 1,
      weight: 2,
      fillColor: "#1a1a1a",
      fillOpacity: 1 // keep roads with no fill
    }
  },
  {
    name: "Blocks",
    url: "/FULL BLOCK.json",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 3,
      fillColor: "#fafafa",
      fillOpacity: 1
    }
  },
  {
    name: "Sport",
    url: "/FULL SPORT.json",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 3,
      fillColor: "#c2d89a",
      fillOpacity: 1
    }
  },
  {
    name: "Green",
    url: "/FULL GREEN1.json",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 2,
      fillColor: "#9bb987",
      fillOpacity: 1
    }
  },
  {
    name: "Land",
    url: "/FULL LAND.json",
    visible: true, // Make visible for debugging
    style: {
      strokeColor: "#1a1a1a",
      strokeOpacity: 0,
      weight: 2,
      fillColor: "#dbc5b7",
      fillOpacity: 1
    }
  }
];