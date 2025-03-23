"use client"

import { Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SmartFilters() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          <CardTitle>Smart Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Donor Type</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All Donors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donors</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="foundation">Foundation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Interest Area</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="research">Cancer Research</SelectItem>
              <SelectItem value="patient-care">Patient Care</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="community">Community Outreach</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
} 