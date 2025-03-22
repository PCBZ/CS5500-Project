import Link from "next/link"
import { SearchIcon, UserIcon, CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function DonorsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">BC Cancer Foundation</h1>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard" className="px-3 py-2 text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/events" className="px-3 py-2 text-sm font-medium">
              Events
            </Link>
            <Link href="/donors" className="bg-blue-600 px-3 py-2 text-sm font-medium text-white rounded-md">
              Donors
            </Link>
            <Link href="/reports" className="px-3 py-2 text-sm font-medium">
              Reports
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Donor Management</h2>
              <p className="text-gray-600">Review and manage donor lists for upcoming events</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2">
                Export List
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Donor List Section */}
            <div className="md:col-span-2">
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium">Donor Review List: Spring Gala 2025</span>
                  </div>

                  <div className="relative mb-6">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input 
                      type="search" 
                      placeholder="Search donors" 
                      className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200" 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <div className="text-3xl font-bold">45</div>
                      <div className="text-sm text-gray-500">Pending Review</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">28</div>
                      <div className="text-sm text-gray-500">Approved</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">12</div>
                      <div className="text-sm text-gray-500">Excluded</div>
                    </div>
                  </div>

                  {/* Donor List */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 border-l-4 border-l-green-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">John Smith</h3>
                            <Badge className="bg-green-100 text-green-800 text-xs">High Priority</Badge>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Cancer Research Interest</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Relationships: Smith Corp, Smith Family Foundation</p>
                          <p className="text-sm text-gray-600">Previous Events: Gala 2024, Research Symposium 2024</p>
                        </div>
                        <div className="text-green-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Smith Corporation</h3>
                            <Badge className="bg-gray-100 text-gray-800 text-xs">Auto-Excluded</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Corporate</p>
                          <div className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            Never Invite - Link to Individual
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Relationships: John Smith</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 border-l-4 border-l-green-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Emily Johnson</h3>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">Patient Care Interest</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Previous Events: Patient Care Roundups 2023</p>
                        </div>
                        <div className="text-green-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Showing 1-3 of 85 donors
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="px-4">Previous</Button>
                      <Button variant="outline" size="sm" className="px-4 bg-gray-50">1</Button>
                      <Button variant="outline" size="sm" className="px-4">2</Button>
                      <Button variant="outline" size="sm" className="px-4">3</Button>
                      <Button variant="outline" size="sm" className="px-4">Next</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details */}
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                <div className="p-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    Event Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Spring Gala 2025</h4>
                      <p className="text-sm text-gray-600">Major Donor Event</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      March 15, 2025
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4" />
                      Vancouver Convention Center
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UsersIcon className="h-4 w-4" />
                      Capacity: 200 attendees
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      Review deadline: Feb 20, 2025
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Filters */}
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                <div className="p-6">
                  <h3 className="font-medium mb-4">Smart Filters</h3>
                  {/* Add filter content here if needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 