// Seed script: imports grand list data into Supabase
// Run with: npx tsx scripts/seed.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const websiteProspects = [
  { business: "Leo's Restaurant & Take-Out", phone: "(709) 726-2658", category: "Restaurant", website: "Facebook only", priority: true, notes: "4.7 stars, 93 reviews. No site to capture orders. Pitch: online ordering = bigger orders." },
  { business: "Joe's Barber Shop", phone: "(709) 727-5290", category: "Barbershop", website: "None", priority: true, notes: "4.9 stars, appointment-only, no online booking. Booking page is an easy sell." },
  { business: "NewLine Electrical Ltd", phone: "(709) 765-3255", category: "Electrician", website: "Facebook only", priority: true, notes: "Active business, open till 7pm. Real site adds credibility for commercial contracts." },
  { business: "Powerlite Electric Ltd", phone: "(709) 726-1180", category: "Electrician", website: "Facebook only", priority: true, notes: "Commercial, residential, marine. Facebook-only hurts credibility." },
  { business: "Williams Auto Repair", phone: "(709) 738-0426", category: "Auto Repair", website: "Blogspot blog", priority: true, notes: "Free Blogspot site looks unprofessional. 'Your site is hurting you' pitch." },
  { business: "Paddy's Auto", phone: "(709) 219-9558", category: "Auto Repair", website: "Blogspot blog", priority: true, notes: "Shares the same Blogspot blog as Williams. No real website." },
  { business: "Dynamic Cleaners Inc", phone: "(709) 769-4877", category: "Cleaning", website: "Instagram only", priority: true, notes: "Commercial cleaning needs a pro site to win contracts. Instagram-only won't cut it." },
  { business: "E & A Truck Repair", phone: "(709) 690-4702", category: "Auto Repair", website: "None", priority: false, notes: "Open 6am-11:30pm daily, busy shop, zero web presence." },
  { business: "Snow's Autotech", phone: "(709) 722-7799", category: "Auto Repair", website: "None", priority: false, notes: "Active shop on Riverview Ave, invisible online." },
  { business: "East Coast Custom Ltd", phone: "(709) 685-0355", category: "Auto Repair", website: "None", priority: false, notes: "Auto repair + car dealership, no web presence." },
  { business: "Rogers R S Ltd", phone: "(709) 579-1078", category: "Plumbing", website: "None", priority: false, notes: "Plumbing/heating/HVAC contractor on Pennywell Rd." },
  { business: "Arch Rose Plumbing", phone: "(709) 699-9699", category: "Plumbing", website: "None", priority: false, notes: "No website at all." },
  { business: "Plumbing Xperts", phone: "(709) 685-1585", category: "Plumbing", website: "None", priority: false, notes: "No website. Generic name, may need branding help too." },
  { business: "Sonic Electrical Ltd", phone: "(709) 782-0228", category: "Electrician", website: "None", priority: false, notes: "No website at all." },
  { business: "A C Electric", phone: "(709) 690-9997", category: "Electrician", website: "None", priority: false, notes: "Contractor on Larkhall St, no website." },
  { business: "Master Wire Works", phone: "(709) 691-0401", category: "Electrician", website: "None", priority: false, notes: "Contractor on Albany St, no website." },
  { business: "Jendore Ltd", phone: "(709) 747-4209", category: "Electrician", website: "None", priority: false, notes: "Electrical + construction company, no website." },
  { business: "Stan's Barber Shop", phone: "(709) 579-5744", category: "Barbershop", website: "None", priority: false, notes: "5.0 stars, zero web presence." },
  { business: "Extra-Clean", phone: "(709) 853-9577", category: "Cleaning", website: "None", priority: false, notes: "No website at all." },
  { business: "EGL Cleaning Services", phone: "(709) 638-4156", category: "Cleaning", website: "None", priority: false, notes: "No website at all." },
]

const clubs = [
  { business: "Vandals Rugby Football Club", category: "Sports", website: "https://vandalsrfc.ca/", notes: "Rugby club, 41+ years. Youth to adult, all genders." },
  { business: "Ultimate NL", category: "Sports", website: "https://www.ultimatenl.ca/", notes: "Provincial ultimate frisbee org. Very active." },
  { business: "Avalon Sport and Social Club", category: "Sports", website: "https://avalon.sportandsocialclub.ca/", notes: "Adult rec leagues. Softball, soccer, volleyball." },
  { business: "St. John's Curling Club", category: "Sports", website: "https://www.stjohnscurlingclub.com/", email: "sjccmanager@gmail.com", notes: "Competitive and social leagues, learn-to-curl." },
  { business: "St. John's Legends Swim Club", category: "Sports", website: "https://www.sjlegends.com/", notes: "Competitive swim club since 1978." },
  { business: "Riverdale Tennis Club", category: "Sports", website: "http://www.sjta.ca/", notes: "Outdoor tennis, leagues and social play." },
  { business: "Metro Soccer League", category: "Sports", website: "https://playsport.com/metrosoccerleague_ag_13a60670", notes: "Youth and adult soccer." },
  { business: "Republic BJJ", category: "Martial Arts", website: "http://www.republicbjj.com/", notes: "Brazilian jiu-jitsu academy, 80 Crosbie Rd." },
  { business: "The Rock Kendo Club", category: "Martial Arts", website: "http://therockkendo.com/", notes: "Kendo club, Canadian Kendo Federation affiliated." },
  { business: "East Coast Trail Association", category: "Outdoors", website: "https://eastcoasttrail.com/", email: "information@eastcoasttrail.com", notes: "Trail association, hiking community." },
  { business: "AMBA", category: "Outdoors", website: "https://ambanl.ca/", email: "info@ambanl.ca", notes: "Avalon Mountain Bike Association." },
  { business: "Take The Lead Dance Studio", category: "Arts", website: "https://taketheleaddance.ca/", email: "info@taketheleaddance.ca", notes: "Dance studio." },
]

async function seed() {
  console.log('Seeding contacts...')

  const contacts = [
    ...websiteProspects.map(p => ({
      business_name: p.business,
      phone: p.phone,
      category: p.category,
      contact_type: 'prospect',
      website_status: p.website,
      priority: p.priority,
      notes: p.notes,
    })),
    ...clubs.map(c => ({
      business_name: c.business,
      category: c.category,
      contact_type: 'club',
      website_status: c.website,
      email: (c as any).email || null,
      priority: false,
      notes: c.notes,
    })),
  ]

  const { data, error } = await supabase.from('contacts').insert(contacts).select('id')
  if (error) {
    console.error('Error seeding contacts:', error)
    return
  }

  console.log(`✅ Seeded ${data.length} contacts`)

  // Add all website prospects to the websites pipeline (Lead stage)
  const { data: leadStage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline', 'websites')
    .eq('name', 'Lead')
    .single()

  if (leadStage && data) {
    const prospectIds = data.slice(0, websiteProspects.length).map(c => c.id)
    const deals = prospectIds.map((contact_id, i) => ({
      contact_id,
      stage_id: leadStage.id,
      pipeline: 'websites',
      value: 300,
      recurring_value: 50,
      position: i,
    }))

    const { error: dealError } = await supabase.from('deals').insert(deals)
    if (dealError) console.error('Error seeding deals:', dealError)
    else console.log(`✅ Added ${deals.length} deals to websites pipeline`)
  }

  // Add clubs to clubs pipeline
  const { data: clubLeadStage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline', 'clubs')
    .eq('name', 'Lead')
    .single()

  if (clubLeadStage && data) {
    const clubIds = data.slice(websiteProspects.length).map(c => c.id)
    const deals = clubIds.map((contact_id, i) => ({
      contact_id,
      stage_id: clubLeadStage.id,
      pipeline: 'clubs',
      value: 0,
      recurring_value: 0,
      position: i,
    }))

    const { error: dealError } = await supabase.from('deals').insert(deals)
    if (dealError) console.error('Error seeding club deals:', dealError)
    else console.log(`✅ Added ${deals.length} deals to clubs pipeline`)
  }

  console.log('🎉 Seed complete!')
}

seed()
