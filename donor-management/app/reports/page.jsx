import Link from "next/link"
import { RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsPage() {
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
            <Link href="/donors" className="px-3 py-2 text-sm font-medium">
              Donors
            </Link>
            <Link href="/reports" className="bg-blue-600 px-3 py-2 text-sm font-medium text-white rounded-md">
              Reports
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Reporting & Analytics</h2>
              <p className="text-muted-foreground">Performance metrics and insights</p>
            </div>
            <div className="mt-4 flex items-center gap-4 md:mt-0">
              <Select defaultValue="6-months">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-days">Last 30 Days</SelectItem>
                  <SelectItem value="3-months">Last 3 Months</SelectItem>
                  <SelectItem value="6-months">Last 6 Months</SelectItem>
                  <SelectItem value="12-months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="event-metrics">Event Metrics</TabsTrigger>
              <TabsTrigger value="pmm-performance">PMM Performance</TabsTrigger>
              <TabsTrigger value="donor-analytics">Donor Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Review Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      2.3 <span className="text-base">days</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">↓ 0.5 from previous period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Donor Acceptance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">86%</div>
                    <p className="text-xs text-green-600 mt-1">↑ 2% from previous period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Exclusion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">14%</div>
                    <p className="text-xs text-muted-foreground mt-1">No change from previous</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {/* This would be a chart in a real application */}
                      <div className="flex h-full items-end gap-2 pb-6 pt-10">
                        <div className="relative flex h-full w-full flex-col justify-end">
                          <div className="absolute -left-4 bottom-0 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-1/4 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-2/4 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-3/4 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-full w-full border-b border-dashed"></div>

                          <div className="absolute -bottom-6 left-[10%] text-xs text-muted-foreground">Jan</div>
                          <div className="absolute -bottom-6 left-[30%] text-xs text-muted-foreground">Feb</div>
                          <div className="absolute -bottom-6 left-[50%] text-xs text-muted-foreground">Mar</div>
                          <div className="absolute -bottom-6 left-[70%] text-xs text-muted-foreground">Apr</div>
                          <div className="absolute -bottom-6 left-[90%] text-xs text-muted-foreground">May</div>

                          <div className="flex h-full w-full items-end justify-around">
                            <div className="w-4 bg-blue-500" style={{ height: "60%" }}></div>
                            <div className="w-4 bg-blue-500" style={{ height: "75%" }}></div>
                            <div className="w-4 bg-blue-500" style={{ height: "45%" }}></div>
                            <div className="w-4 bg-blue-500" style={{ height: "90%" }}></div>
                            <div className="w-4 bg-blue-500" style={{ height: "65%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {/* This would be a chart in a real application */}
                      <div className="flex h-full items-end gap-8 pb-6 pt-10">
                        <div className="relative flex h-full w-full flex-col justify-end">
                          <div className="absolute -left-4 bottom-0 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-1/4 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-2/4 w-full border-b border-dashed"></div>
                          <div className="absolute -left-4 bottom-3/4 w-full border-b border-dashed"></div>

                          <div className="flex h-full w-full items-end justify-around">
                            <div className="flex gap-2">
                              <div className="w-8 bg-purple-500" style={{ height: "90%" }}></div>
                              <div className="w-8 bg-green-500" style={{ height: "80%" }}></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-8 bg-purple-500" style={{ height: "30%" }}></div>
                              <div className="w-8 bg-green-500" style={{ height: "25%" }}></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-8 bg-purple-500" style={{ height: "60%" }}></div>
                              <div className="w-8 bg-green-500" style={{ height: "50%" }}></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-8 bg-purple-500" style={{ height: "40%" }}></div>
                              <div className="w-8 bg-green-500" style={{ height: "35%" }}></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-8 bg-purple-500" style={{ height: "70%" }}></div>
                              <div className="w-8 bg-green-500" style={{ height: "65%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 