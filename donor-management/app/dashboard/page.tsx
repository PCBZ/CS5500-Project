import Link from "next/link"
import { CalendarIcon, CheckCircleIcon, ClockIcon, UsersIcon } from "lucide-react"

const stats = [
  {
    title: "Active Events",
    value: "5",
    icon: CalendarIcon,
    color: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    title: "Donors Reviewed",
    value: "143",
    icon: CheckCircleIcon,
    color: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    title: "Pending Review",
    value: "67",
    icon: ClockIcon,
    color: "bg-yellow-50",
    iconColor: "text-yellow-600"
  },
  {
    title: "Total Invitations",
    value: "285",
    icon: UsersIcon,
    color: "bg-purple-50",
    iconColor: "text-purple-600"
  }
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">BC Cancer Foundation</h1>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard" className="bg-blue-600 px-3 py-2 text-sm font-medium text-white rounded-md">
              Dashboard
            </Link>
            <Link href="/events" className="px-3 py-2 text-sm font-medium">
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
          <div className="space-y-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className={`${stat.color} rounded-lg p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`rounded-full bg-white p-3`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

