
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"

const businessTypes = [
    "hospitals", "hotels", "motels", "restaurants", "cafes", "bars", "nightclubs",
    "schools", "colleges", "universities", "training centers", "daycare centers",
    "gyms", "fitness studios", "yoga studios", "spas", "salons", "shopping malls",
    "retail stores", "supermarkets", "grocery stores", "convenience stores",
    "warehouses", "factories", "manufacturing plants", "assembly units", "showrooms",
    "car dealerships", "auto repair shops", "gas stations", "cinemas", "theaters",
    "museums", "art galleries", "airports", "train stations", "bus terminals",
    "shipping ports", "government buildings", "courthouses", "police stations",
    "fire stations", "libraries", "community centers", "religious centers", "churches",
    "mosques", "temples", "construction sites", "event venues", "conference centers",
    "exhibition halls", "banquet halls", "wedding venues", "sports stadiums", "arenas",
    "swimming pools", "clubs", "lodges", "resorts", "bed and breakfasts",
    "service apartments", "student hostels", "worker accommodations", "parking garages",
    "public parks offices", "recreational centers", "amusement parks", "zoos",
    "aquariums", "medical clinics", "dental clinics", "veterinary clinics", "pharmacies",
    "laboratories", "research facilities", "data centers", "call centers",
    "telecom offices", "broadcast studios", "printing presses", "publishing houses",
    "logistics hubs", "courier offices", "storage units", "cold storage facilities",
    "meat processing plants", "bakeries", "breweries", "distilleries",
    "food processing plants", "laundromats", "dry cleaners", "textile factories",
    "tailoring shops", "jewelry stores", "furniture stores", "appliance stores",
    "electronics stores", "IT service centers", "coworking spaces", "coworking hubs",
    "real estate offices", "corporate headquarters offices", "law firm offices",
    "accounting firm offices", "insurance company offices", "real estate agency offices",
    "architectural firm offices", "engineering firm offices", "marketing agency offices",
    "advertising agency offices", "travel agency offices", "consultancy firm offices",
    "recruitment agency offices", "nonprofit organization offices", "charity organization offices",
    "financial institution offices", "investment company offices", "stockbroker offices",
    "media company offices", "newspaper offices", "magazine publishing offices",
    "television network offices", "radio station offices", "call center offices",
    "customer service center offices", "government administration offices",
    "municipal corporation offices", "embassy offices", "consulate offices",
    "construction company offices", "property management offices", "IT company offices",
    "software development offices", "cybersecurity company offices", "e-commerce company offices",
    "import export company offices", "shipping company offices", "logistics company offices",
    "transport company offices", "medical clinic offices", "dental clinic offices",
    "physiotherapy clinic offices", "chiropractic clinic offices", "dermatology clinic offices",
    "eye care clinic offices", "veterinary clinic offices", "hospital administration offices",
    "surgical center offices", "laboratory offices", "diagnostic center offices",
    "research and development offices", "school administration offices",
    "private tutoring center offices", "training institute offices", "language school offices",
    "college administration offices", "university administration offices",
    "sports club offices", "gym management offices", "yoga studio offices",
    "spa management offices", "beauty salon offices", "hotel administration offices",
    "resort management offices", "bed and breakfast management offices", "motel management offices",
    "restaurant management offices", "cafe management offices", "bar management offices",
    "nightclub management offices", "fast food chain offices", "bakery management offices",
    "supermarket chain offices", "retail store chain offices", "boutique store offices",
    "electronics store offices", "furniture showroom offices", "car dealership offices",
    "auto repair workshop offices", "gas station offices", "cinema management offices",
    "theater management offices", "museum management offices", "art gallery management offices",
    "airport administration offices", "train station offices", "bus terminal offices",
    "seaport administration offices", "stadium management offices", "arena management offices",
    "swimming pool management offices", "amusement park management offices",
    "zoo management offices", "aquarium management offices", "event venue offices",
    "conference center offices", "exhibition hall offices", "banquet hall offices",
    "wedding venue offices", "religious institution offices", "church offices",
    "mosque offices", "temple offices", "library administration offices",
    "community center offices", "coworking space management offices", "data center offices"
].map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));


export function BusinessTypeSelector() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
     <div className="space-y-2">
      <Label htmlFor="businessType">Business Type</Label>
       <input type="hidden" name="businessType" value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? businessTypes.find((bt) => bt.value === value)?.label
              : "Select business type..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search business type..." />
            <CommandEmpty>No business type found.</CommandEmpty>
            <CommandGroup>
             <ScrollArea className="h-72">
                <CommandList>
                    {businessTypes.map((bt) => (
                    <CommandItem
                        key={bt.value}
                        value={bt.value}
                        onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                        }}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            value === bt.value ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {bt.label}
                    </CommandItem>
                    ))}
                </CommandList>
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
