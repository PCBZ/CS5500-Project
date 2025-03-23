import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EventDetails() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          <CardTitle>Event Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Spring Gala 2025</h3>
            <p className="text-sm text-muted-foreground">Major Donor Event</p>
          </div>

          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>March 15, 2025</span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Vancouver Convention Centre</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Capacity: 200 attendees</span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Review Deadline: Feb 20, 2025</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 