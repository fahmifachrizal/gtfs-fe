import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  MapPin,
  Route,
  Clock,
  Calendar,
  CreditCard,
  Upload,
  FolderPlus,
  BookOpen,
  Zap,
  Globe,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUser } from "@/contexts/UserContext"
import HeroDynamic from "@/components/maps/hero-section-dynamic"
import "leaflet/dist/leaflet.css"
import { request } from "@/utils/request"

const features = [
  {
    icon: MapPin,
    title: "Transit Stops Management",
    description:
      "Create and manage bus stops, train stations, and other transit locations with precise coordinates and detailed information.",
  },
  {
    icon: Route,
    title: "Route Planning",
    description:
      "Design transit routes with multiple stops, define directions, and set up complex transportation networks.",
  },
  {
    icon: Clock,
    title: "Trip Scheduling",
    description:
      "Schedule vehicle trips, manage service times, and coordinate transportation services efficiently.",
  },
  {
    icon: Calendar,
    title: "Service Calendar",
    description:
      "Set up operating schedules, define service periods, and manage holiday exceptions with ease.",
  },
  {
    icon: CreditCard,
    title: "Fare Management",
    description:
      "Configure fare rules, set pricing structures, and manage payment systems for your transit network.",
  },
  {
    icon: Upload,
    title: "Data Import/Export",
    description:
      "Import existing GTFS data or export your work in standard GTFS format for use with other applications.",
  },
]

const benefits = [
  {
    icon: Zap,
    title: "Easy to Use",
    description:
      "Intuitive interface designed for both beginners and experienced transit planners.",
  },
  {
    icon: Globe,
    title: "Standard Compliant",
    description:
      "Full compliance with GTFS specifications ensuring compatibility with major transit applications.",
  },
  {
    icon: Shield,
    title: "Reliable & Secure",
    description:
      "Your transit data is protected with enterprise-grade security and regular backups.",
  },
]

export default function Home() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  // Route definitions for hero map
  function generateRoutes() {
    const colors = [
      "#ff6b35",
      "#95e1d3",
      "#f6bd60",
      "#6a4c93",
      "#4ecdc4",
      "#ffb347",
      "#1a535c",
      "#ff6f61",
      "#43aa8b",
      "#577590",
      "#ff6b35",
      "#95e1d3",
      "#f6bd60",
      "#6a4c93",
    ]

    const markerColors = [
      "orange",
      "emerald",
      "yellow",
      "purple",
      "teal",
      "amber",
      "cyan",
      "red",
      "green",
      "blue",
      "orange",
      "emerald",
      "yellow",
      "purple",
    ]

    return Array.from({ length: 14 }, (_, i) => {
      const number = i + 1
      return {
        id: `route-${number}-outbound`,
        name: `Route ${number} Outbound`,
        apiParams: { number, dir: "outbound" },
        config: {
          speed: 1000 + i * 50, // can adjust to vary speed per route
          color: colors[i],
          weight: 4,
          opacity: 1,
          intervalSeconds: 3 + (i % 3), // vary between 2–4
          maxInstances: 100, // alternate 2–3
          autoStart: true,
          cleanupDelay: 100,
          markerColor: markerColors[i],
        },
      }
    })
  }

  // Fetch all routes on component mount
  useEffect(() => {
    const fetchAllRoutes = async () => {
      try {
        setLoading(true)
        const fetchedRoutes = []

        for (const routeDef of generateRoutes()) {
          try {
            const { number, dir } = routeDef.apiParams

            const geojsonData = await request({
              url: `/api/route?number=${number}&dir=${dir}`,
              method: 'GET'
            })

            fetchedRoutes.push({
              id: routeDef.id,
              name: routeDef.name,
              geojsonData,
              config: routeDef.config,
            })

            console.log(`Fetched ${routeDef.name}`)
          } catch (err) {
            console.error(`Error fetching ${routeDef.name}:`, err)
          }
        }

        setRoutes(fetchedRoutes)
      } catch (error) {
        console.error("Error loading routes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllRoutes()
  }, [])

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = () => {
    if (user) {
      navigate("/editor")
    } else {
      navigate("/login")
    }
  }

  // Calculate transform values based on scroll
  const mapTransform = {
    rotateX: Math.min(30 + scrollY * 0.05, 80),
    translateY: scrollY * 0.3,
    scale: Math.max(1 + scrollY * 0.0005, 1.3),
  }

  const contentOpacity = Math.max(1 - scrollY * 0.002, 0)
  const contentTranslateY = scrollY * 0.5

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Tilted Map Background */}
      <section className="relative h-screen overflow-hidden">
        {/* Map Background Container */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            perspective: "1920px",
            perspectiveOrigin: "center center",
          }}>
          {/* Map Container with 3D Transform */}
          <div
            className="absolute inset-0 w-full h-[120%] -top-[15%]"
            style={{
              transform: `
                rotateX(${mapTransform.rotateX}deg)
                translateY(${mapTransform.translateY}px)
                scale(${mapTransform.scale})
              `,
              transformOrigin: "center center",
            }}>
            <HeroDynamic
              center={[-6.175389, 106.827139]}
              zoom={13}
              routes={routes}
              className="h-full w-full bg-background"
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 80%,
                hsl(var(--background) / 0.6) 90%,
                hsl(var(--background) / 0.9) 95%,
                hsl(var(--background)) 100%
              )`,
            }}
          />
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 flex items-center justify-center h-full px-6"
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentTranslateY}px)`,
          }}>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Build Better Transit
              <span className="text-primary block">With GTFS Editor</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Create, manage, and publish public transit feeds using the General
              Transit Feed Specification (GTFS). Our intuitive editor makes it
              easy to build comprehensive transit data for trip planners, mobile
              apps, and other transportation tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6">
                {user ? "Go to Editor" : "Get Started"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-lg px-8 py-6">
                <Link to="/editor">
                  <FolderPlus className="mr-2 h-5 w-5" />
                  View Projects
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          style={{
            opacity: contentOpacity,
          }}>
          <div className="flex flex-col items-center text-foreground/70">
            <span className="text-sm text-foreground mb-2">
              Scroll to explore
            </span>
            <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
              <div
                className="w-1 h-3 bg-foreground/50 rounded-full mt-2 animate-bounce"
                style={{
                  animationDelay: "0.5s",
                  animationDuration: "2s",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for GTFS
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to create, edit, and manage all aspects of
              your transit data
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose GTFS Editor?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by transit professionals, for transit professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* GTFS Information Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About GTFS</h2>
          </div>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">
                  General Transit Feed Specification
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  GTFS is a data specification that allows public transit
                  agencies to publish their transit data in a format that can be
                  consumed by a wide variety of software applications. GTFS
                  feeds are used by Google Maps, Apple Maps, transit apps, and
                  many other services to help people navigate public
                  transportation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  With our GTFS Editor, you can create compliant feeds that work
                  seamlessly with all major trip planning applications, helping
                  more people discover and use your transit services.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join transit agencies worldwide who trust GTFS Editor to manage
            their public transportation data
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 hover:scale-105 transition-transform duration-200">
              {user ? "Open Editor" : "Start Free Trial"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-lg px-8 py-6 hover:scale-105 transition-transform duration-200">
              <Link to="/editor">
                <FolderPlus className="mr-2 h-5 w-5" />
                Browse Projects
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
