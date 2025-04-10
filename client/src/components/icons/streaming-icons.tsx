import { SiNetflix, SiHbo, SiAmazonprime, SiAppletv } from "react-icons/si";
import { MdLocalMovies } from "react-icons/md";

export type StreamingServiceName = 
  | "Netflix" 
  | "Hulu" 
  | "Disney+" 
  | "HBO Max" 
  | "Prime Video" 
  | "Apple TV+" 
  | string;

export interface StreamingService {
  id: number;
  name: StreamingServiceName;
  icon: React.ReactNode;
  bgColor?: string;
}

export const getStreamingServiceIcon = (name: StreamingServiceName) => {
  switch (name) {
    case "Netflix":
      return <SiNetflix className="w-8 h-8" />;
    case "Hulu":
      return <MdLocalMovies className="w-8 h-8" />;
    case "Disney+":
      return <MdLocalMovies className="w-8 h-8" />;
    case "HBO Max":
      return <SiHbo className="w-8 h-8" />;
    case "Prime Video":
      return <SiAmazonprime className="w-8 h-8" />;
    case "Apple TV+":
      return <SiAppletv className="w-8 h-8" />;
    default:
      return null;
  }
};

export const streamingServices: StreamingService[] = [
  {
    id: 1,
    name: "Netflix",
    icon: <SiNetflix className="w-8 h-8" />,
    bgColor: "#e50914"
  },
  {
    id: 2,
    name: "Hulu",
    icon: <MdLocalMovies className="w-8 h-8" />,
    bgColor: "#1ce783"
  },
  {
    id: 3,
    name: "Disney+",
    icon: <MdLocalMovies className="w-8 h-8" />,
    bgColor: "#0063e5"
  },
  {
    id: 4,
    name: "HBO Max",
    icon: <SiHbo className="w-8 h-8" />,
    bgColor: "#5822b4"
  },
  {
    id: 5,
    name: "Prime Video",
    icon: <SiAmazonprime className="w-8 h-8" />,
    bgColor: "#00a8e1"
  },
  {
    id: 6,
    name: "Apple TV+",
    icon: <SiAppletv className="w-8 h-8" />,
    bgColor: "#000000"
  }
];
