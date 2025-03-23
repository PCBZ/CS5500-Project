import Link from "next/link"
import { CalendarIcon, FilterIcon, MapPinIcon, SearchIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">BC Cancer Foundation</h1>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard" className="px-3 py-2 text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/events" className="bg-blue-600 px-3 py-2 text-sm font-medium text-white rounded-md">
              Events
            </Link>
            <Link href="/donors" className="px-3 py-2 text-sm font-medium">
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
              <h2 className="text-2xl font-bold">Event Management</h2>
              <p className="text-gray-600">Plan, organize and track fundraising events</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2">
                Create New Event
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-8 border-b">
              <button className="border-b-2 border-blue-600 pb-2 text-blue-600">
                Upcoming Events
              </button>
              <button className="pb-2 text-gray-600">
                Past Events
              </button>
              <button className="pb-2 text-gray-600">
                All Events
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  type="search" 
                  placeholder="Search Events" 
                  className="pl-10 pr-4 py-2 w-[400px] rounded-lg border border-gray-200" 
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 border rounded-lg px-4 py-2">
                <FilterIcon className="h-5 w-5" />
                Filters
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">EVENT NAME</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">DATE</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">LOCATION</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">CAPACITY</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">STATUS</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">Spring Gala 2025</div>
                        <div className="text-sm text-gray-500">Major Donor event</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        March 15, 2025
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        Vancouver
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        200
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>PMM Review 3/5</div>
                        <div className="text-sm text-gray-500">Due Feb 20</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">...</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">Research Symposium 2025</div>
                        <div className="text-sm text-gray-500">Research Event</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        May 20, 2025
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        Victoria
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        50
                      </div>
                    </td>
                    <td className="px-6 py-4">Planning</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">...</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">Donor Appreciation Event</div>
                        <div className="text-sm text-gray-500">Cultural Event</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        June 10, 2025
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        Vancouver
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        100
                      </div>
                    </td>
                    <td className="px-6 py-4">Ready for invitations</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">...</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing 1-3 of 12 events
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
      </main>
    </div>
  )
} 