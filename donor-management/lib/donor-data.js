// This is a Node.js script that could be used to generate or process donor data

// Sample donor data structure
const donors = [
  {
    id: "1",
    name: "John Smith",
    type: "individual",
    tags: ["High Priority", "Cancer Research Interest"],
    relationships: ["Smith Corp.", "Smith Family Foundation"],
    previousEvents: ["Gala 2024", "Research Symposium 2024"],
    status: "pending",
    email: "john.smith@example.com",
    phone: "604-555-1234",
    donationHistory: [
      { amount: 5000, date: "2024-01-15", campaign: "Winter Appeal" },
      { amount: 10000, date: "2023-06-10", campaign: "Research Initiative" },
    ],
  },
  {
    id: "2",
    name: "Smith Corporation",
    type: "corporate",
    tags: ["Corporate", "Never Invite - Link to Individual"],
    relationships: ["John Smith"],
    previousEvents: [],
    status: "auto-excluded",
    email: "contact@smithcorp.com",
    phone: "604-555-5678",
    donationHistory: [{ amount: 25000, date: "2023-11-20", campaign: "Corporate Partners" }],
  },
  {
    id: "3",
    name: "Emily Johnson",
    type: "individual",
    tags: ["Patient Care Interest"],
    relationships: [],
    previousEvents: ["Patient Care Roundtable 2023"],
    status: "pending",
    email: "emily.johnson@example.com",
    phone: "604-555-9012",
    donationHistory: [
      { amount: 2500, date: "2024-02-05", campaign: "Patient Support" },
      { amount: 1000, date: "2023-09-15", campaign: "Annual Fund" },
    ],
  },
]

// Function to filter donors by various criteria
function filterDonors(options = {}) {
  const { status, type, interestArea, searchQuery } = options

  return donors.filter((donor) => {
    // Filter by status if provided
    if (status && donor.status !== status) return false

    // Filter by type if provided
    if (type && donor.type !== type) return false

    // Filter by interest area if provided
    if (interestArea) {
      const interestMap = {
        research: "Cancer Research Interest",
        "patient-care": "Patient Care Interest",
      }
      if (!donor.tags.includes(interestMap[interestArea])) return false
    }

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = donor.name.toLowerCase().includes(query)
      const emailMatch = donor.email.toLowerCase().includes(query)
      if (!nameMatch && !emailMatch) return false
    }

    return true
  })
}

// Function to generate donor statistics
function generateDonorStats() {
  const totalDonors = donors.length
  const pendingReview = donors.filter((d) => d.status === "pending").length
  const approved = donors.filter((d) => d.status === "approved").length
  const excluded = donors.filter((d) => d.status === "excluded" || d.status === "auto-excluded").length

  const totalDonations = donors.reduce((sum, donor) => {
    return sum + donor.donationHistory.reduce((donorSum, donation) => donorSum + donation.amount, 0)
  }, 0)

  return {
    totalDonors,
    pendingReview,
    approved,
    excluded,
    totalDonations,
    averageDonation: totalDonations / totalDonors,
  }
}

// Example usage
const filteredDonors = filterDonors({ type: "individual", interestArea: "research" })
const stats = generateDonorStats()

console.log("Filtered Donors:", filteredDonors)
console.log("Donor Statistics:", stats)

// This could be exported for use in a Next.js API route
module.exports = {
  donors,
  filterDonors,
  generateDonorStats,
}

