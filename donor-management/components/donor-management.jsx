"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DonorList from "@/components/donor-list"
import EventDetails from "@/components/event-details"
import SmartFilters from "@/components/smart-filters"

export default function DonorManagement() {
  const [selectedEvent, setSelectedEvent] = useState("spring-gala-2025")
  const [searchQuery, setSearchQuery] = useState("")

  const handleEventChange = (value) => {
    setSelectedEvent(value)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Donor Management</h2>
          <p className="text-muted-foreground">Review and manage donor lists for upcoming events</p>
        </div>
        <div className="mt-4 flex items-center gap-4 md:mt-0">
          <Select value={selectedEvent} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spring-gala-2025">Spring Gala 2025</SelectItem>
              <SelectItem value="research-symposium-2025">Research Symposium 2025</SelectItem>
              <SelectItem value="donor-appreciation-2025">Donor Appreciation Event</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export List</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Donor Review List: Spring Gala 2025</CardTitle>
              <div className="mt-2">
                <Input
                  placeholder="Search donors"
                  className="max-w-sm"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">28</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Excluded</div>
                </div>
              </div>

              <DonorList />

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Showing 1-3 of 85 donors</div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-50">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <EventDetails />
          <SmartFilters />
        </div>
      </div>
    </div>
  )
} 