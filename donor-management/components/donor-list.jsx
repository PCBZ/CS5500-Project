"use client"

import { useState } from "react"
import { AlertCircle, Calendar, CheckCircle, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DonorList() {
  const [donors, setDonors] = useState([
    {
      id: "1",
      name: "John Smith",
      type: "individual",
      tags: ["High Priority", "Cancer Research Interest"],
      relationships: ["Smith Corp.", "Smith Family Foundation"],
      previousEvents: ["Gala 2024", "Research Symposium 2024"],
      status: "pending",
    },
    {
      id: "2",
      name: "Smith Corporation",
      type: "corporate",
      tags: ["Corporate", "Never Invite - Link to Individual"],
      relationships: ["John Smith"],
      previousEvents: [],
      status: "auto-excluded",
    },
    {
      id: "3",
      name: "Emily Johnson",
      type: "individual",
      tags: ["Patient Care Interest"],
      relationships: [],
      previousEvents: ["Patient Care Roundtable 2023"],
      status: "pending",
    },
  ])

  const handleApprove = (id) => {
    setDonors(donors.map((donor) => (donor.id === id ? { ...donor, status: "approved" } : donor)))
  }

  const handleExclude = (id) => {
    setDonors(donors.map((donor) => (donor.id === id ? { ...donor, status: "excluded" } : donor)))
  }

  return (
    <div className="space-y-4">
      {donors.map((donor) => (
        <div
          key={donor.id}
          className={`border rounded-lg p-4 ${donor.id === "1" ? "border-l-4 border-l-green-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{donor.name}</h3>
            <div className="flex space-x-2">
              {donor.status !== "auto-excluded" && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-500"
                    onClick={() => handleApprove(donor.id)}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleExclude(donor.id)}
                  >
                    <AlertCircle className="h-5 w-5" />
                  </Button>
                </>
              )}
              {donor.status === "auto-excluded" && (
                <Badge variant="outline" className="bg-gray-100">
                  Auto-Excluded
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {donor.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={`
                  ${tag === "High Priority" ? "bg-green-100 text-green-800" : ""}
                  ${tag === "Cancer Research Interest" ? "bg-blue-100 text-blue-800" : ""}
                  ${tag === "Patient Care Interest" ? "bg-purple-100 text-purple-800" : ""}
                  ${tag === "Corporate" ? "bg-gray-100 text-gray-800" : ""}
                  ${tag === "Never Invite - Link to Individual" ? "bg-red-100 text-red-800" : ""}
                `}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {donor.relationships.length > 0 && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Users className="mr-1 h-4 w-4" />
              <span>Relationships: {donor.relationships.join(", ")}</span>
            </div>
          )}

          {donor.previousEvents.length > 0 && (
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Previous Events: {donor.previousEvents.join(", ")}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 