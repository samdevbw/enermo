-- ============================================================
-- EcoGuide starter knowledge base (14 articles)
-- Re-runnable: updates articles by slug. Edit freely — chunks are
-- regenerated automatically by the trigger in migration 008.
--
-- Editorial rule: ENERMO-specific articles describe ONLY what exists on
-- enermo.co.bw today. Planned services are labelled as planned.
-- Technical figures are typical ranges for guidance, not specifications.
-- ============================================================

insert into public.eco_guide_knowledge (slug, title, category, summary, content, source, audience) values

-- ------------------------------------------------------------
('how-solar-energy-works', 'How solar energy works', 'solar',
'How solar panels turn sunlight into electricity, and why Botswana is well suited to solar.',
$$Solar panels (photovoltaic or PV panels) are made of silicon cells. When sunlight hits a cell it knocks electrons loose, creating a direct current (DC). Panels are wired together into an array, and the DC they produce is converted to alternating current (AC) by an inverter so it can run normal household appliances.

How much a panel produces depends on its rated power (for example 450 W or 550 W), how much sunlight reaches it, its angle and direction, temperature and shading. Panels produce most in the middle of the day and nothing at night, which is why many systems add batteries.

A useful planning idea is "peak sun hours": the number of hours per day of equivalent full-strength sunlight (1,000 W per square metre). Botswana has one of the strongest solar resources in the world, with clear skies most of the year, so peak sun hours are high compared with many countries. Exact values vary by location and season, so a professional installer should confirm figures for a specific site.

In the Southern Hemisphere, panels generally perform best facing north, tilted at roughly the site's latitude (around 20 to 25 degrees in most of Botswana). Even partial shade from trees, walls or water tanks can noticeably reduce output, so panel placement matters.

Solar panels have no moving parts, need little maintenance apart from occasional cleaning of dust, and typically come with performance warranties of 20 to 25 years. Output declines slowly over time, commonly by around half a percent per year.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('solar-system-components', 'Solar system components explained', 'solar-components',
'Panels, inverters, batteries, charge controllers, mounting and protection: what each part does.',
$$A complete solar system is more than panels. The main components are:

Solar panels (PV modules) generate DC electricity from sunlight. They are rated in watts peak (Wp). The total of all panels is the array size, usually stated in kilowatts peak (kWp).

The inverter converts DC from the panels or batteries into AC for your appliances. Inverter size (in kW or kVA) must cover the largest total load you want to run at the same time, including the start-up surge of motors such as fridges, pumps and air conditioners.

Batteries store energy for use at night or during power cuts. Capacity is measured in kilowatt-hours (kWh). Only part of a battery's rated capacity should be used regularly; this is the usable depth of discharge.

A charge controller manages how panels charge batteries and protects batteries from overcharging. MPPT (maximum power point tracking) controllers are more efficient than older PWM types. Many hybrid inverters have an MPPT charge controller built in.

Mounting structures hold panels securely at the right angle on a roof or on the ground. They must withstand strong winds.

Protection and wiring include DC and AC isolators, fuses or breakers, surge protection and earthing. These are essential for safety and are a common place where poor installations cut corners.

Monitoring lets you see production, consumption and battery levels, usually through an app or web portal provided with the inverter.

Because components must be matched to each other (voltages, currents and capacities), a qualified installer should design the final system.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('off-grid-grid-tied-hybrid', 'Off-grid, grid-tied and hybrid solar systems', 'solar',
'The three main system types, how they behave during a power cut, and which suits which situation.',
$$There are three main ways to set up a solar system.

Grid-tied systems connect to the utility grid without batteries. Solar power is used first and the grid supplies anything extra. They are the simplest and cheapest per kW, but for safety they switch off during a power cut, so they do not provide backup power. Connecting to the national grid requires approval from the utility (Botswana Power Corporation); your installer should handle this process.

Off-grid systems are not connected to the grid at all. They rely on panels and batteries, sometimes with a generator as backup. They suit farms, cattle posts, lodges and rural homes where the grid is far away or expensive to connect. Because there is no grid to fall back on, they need larger batteries and careful sizing for cloudy days.

Hybrid systems combine both: they use solar first, store energy in batteries, and draw from the grid when needed. During a power cut they keep selected circuits (or the whole home) running from the batteries. Hybrid systems are popular where power cuts happen, because they reduce electricity bills and provide backup.

Choosing a type depends on whether you have grid access, how often power cuts occur, your budget, and whether the goal is mainly saving money, backup power or full independence.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('solar-inverters', 'Solar inverter technologies', 'solar-components',
'String, hybrid and off-grid inverters, sizing in kW/kVA, surge capacity and what to compare.',
$$The inverter is the heart of a solar system. Main types:

String (grid-tie) inverters convert solar DC to AC for grid-tied systems without batteries.

Hybrid inverters manage panels, batteries and the grid together. Most home backup systems in Botswana use hybrid inverters. Many include a built-in MPPT charge controller and a monitoring app.

Off-grid inverters (inverter-chargers) run independently of the grid using batteries, and can usually charge batteries from a generator.

Microinverters sit behind each panel. They help on roofs with partial shading but are less common for battery systems.

When comparing inverters, look at:
- Continuous power rating (kW or kVA): must cover everything you want to run at the same time.
- Surge rating: motors (fridges, pumps, air conditioners, power tools) draw several times their running power when starting.
- Battery voltage and compatible battery types (for example 48 V lithium).
- Maximum PV input power and voltage, and the number of MPPT inputs.
- Output waveform: pure sine wave is needed for sensitive electronics.
- Efficiency, warranty length and local after-sales support.

A common rule of thumb is to choose an inverter with 20 to 25 percent headroom above your expected peak simultaneous load, then check that surge capacity covers motor start-up.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('battery-storage', 'Battery storage: lithium vs lead-acid', 'batteries',
'How battery capacity, depth of discharge and cycle life work, and how lithium compares to lead-acid.',
$$Batteries store solar energy for night-time use and power cuts. Key terms:

Capacity is the energy a battery holds, in kilowatt-hours (kWh). A 5 kWh battery could in theory supply 1 kW for 5 hours.

Depth of discharge (DoD) is how much of that capacity you can regularly use without shortening battery life. Usable capacity = rated capacity x DoD.

Cycle life is how many charge and discharge cycles the battery lasts before its capacity drops significantly.

Lithium iron phosphate (LiFePO4) batteries are now the most common choice for solar. Typical characteristics: usable DoD of around 80 to 90 percent, several thousand cycles, no maintenance, compact and light, with a built-in battery management system (BMS). They cost more upfront but usually less over their lifetime.

Lead-acid batteries (flooded, AGM or gel) are cheaper upfront. They should typically be discharged only to around 50 percent, last far fewer cycles, are heavy, and some types need regular maintenance. They lose capacity faster in high temperatures.

Battery sizing in simple terms: estimate the energy (kWh) you need during the hours without sun or during outages, divide by the usable DoD, and allow for inverter losses. For example, needing 6 kWh overnight with a lithium battery at 90 percent DoD and about 90 percent inverter efficiency gives roughly 6 / 0.9 / 0.9 = about 7.4 kWh of rated battery capacity.

Batteries should be installed in a cool, ventilated, shaded place, and must be compatible with the inverter.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('solar-sizing-basics', 'Estimating the solar system size you need', 'solar-installation',
'A step-by-step method for preliminary sizing from your bill or appliance list, with the assumptions shown.',
$$A preliminary estimate can be made from either your electricity consumption or a list of appliances. It is a starting point only; a qualified installer must check the site before final design.

Step 1: daily energy use. From a bill: monthly kWh divided by 30. For example, 800 kWh per month is about 26.7 kWh per day. From appliances: for each appliance multiply watts x quantity x hours used per day, then add them up and divide by 1,000 to get kWh per day.

Step 2: solar array size. Array kWp = daily kWh / (peak sun hours x system efficiency). System efficiency (often assumed around 75 to 80 percent) covers heat, dust, wiring and inverter losses. With 26.7 kWh per day, 5.5 peak sun hours and 77 percent efficiency: 26.7 / (5.5 x 0.77) = about 6.3 kWp. If the goal is only to offset part of the bill, the array can be smaller.

Step 3: inverter size. Add up the power of appliances likely to run at the same time and add about 25 percent headroom; check surge needs for motors.

Step 4: battery size. Decide how many kWh must be available from the battery (for example overnight use, or a number of hours of backup for essential loads), then divide by usable depth of discharge and inverter efficiency.

Big loads matter most. Electric geysers, stoves, ovens, air conditioners and borehole pumps dominate consumption. Many households reduce system size and cost by moving the geyser to solar water heating and running heavy loads during the day.

Always state assumptions: peak sun hours, efficiency, battery chemistry and DoD, and desired backup hours. Changing any of these changes the result.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('solar-installation-checklist', 'Choosing an installer and what a good installation includes', 'solar-installation',
'Questions to ask installers, quotation comparison, and safety items that should never be skipped.',
$$A solar system is only as good as its installation. When choosing an installer:

- Ask for a site visit before a final quotation. A quote without seeing the roof, distribution board and shading is a rough estimate only.
- Ask what is included: panels, inverter, batteries, mounting, cabling, protection, labour, transport, commissioning and any approvals.
- Compare quotations on the same basis: total kWp of panels, inverter kW, usable battery kWh, brands and warranties, not just the price.
- Check warranties: panels (product and performance), inverter, batteries, and the installer's workmanship warranty.
- Ask who to call for faults and how quickly they respond.
- Ask for an electrical certificate of compliance and the system documentation at handover.

Safety items that should always be present include DC and AC isolators, correctly rated fuses or breakers, surge protection, proper earthing and neat, secured cabling.

On ENERMO you can browse vendors in the Vendor Directory and send enquiries to vendors from their product listings. Vendors with a Verified badge have had their company registration (CIPA) and tax clearance (BURS) documents checked by ENERMO. Verification confirms business documents; it is not an inspection of a specific installation.$$, 'ENERMO EcoGuide', 'customer'),

-- ------------------------------------------------------------
('biogas-basics', 'Biogas: how it works and where it fits', 'biogas',
'How digesters turn manure and organic waste into cooking gas and fertiliser, and typical uses in Botswana.',
$$Biogas is a fuel gas produced when bacteria break down organic material without oxygen, a process called anaerobic digestion. It takes place in a sealed tank called a digester.

Biogas is mostly methane (typically around 50 to 70 percent) and carbon dioxide. It burns with a clean blue flame and can be used for cooking, heating water, lighting with special lamps, and in larger plants for running generators.

Common feedstocks are cattle, pig and chicken manure, kitchen and food waste, and some crop residues. Cattle dung is widely available in Botswana, which makes biogas attractive for farms, cattle posts, schools, prisons, lodges and other institutions with steady organic waste.

The leftover material (digestate or slurry) is a good organic fertiliser for gardens and fields.

Sizing depends on how much feedstock is available every day and how much gas is needed. Household digesters are commonly a few cubic metres in size and mainly used for cooking; farm and institutional plants are much larger. A digester needs a regular daily supply of feedstock mixed with water, and gas production slows in cold weather.

Benefits include lower spending on LPG or firewood, less smoke indoors, better waste management and fertiliser production. A supplier should assess feedstock quantity, water availability and the intended gas use before recommending a size.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('solar-water-heating', 'Solar water heating', 'energy-efficiency',
'Why solar geysers are one of the most effective ways to cut household electricity bills.',
$$In many homes the electric geyser is the single biggest user of electricity. A solar water heater (solar geyser) uses the sun's heat directly to warm water, which is far more efficient than generating electricity with panels and then heating water with it.

Main types:
- Evacuated tube collectors work well in colder weather and are common for homes.
- Flat plate collectors are robust and widely used.
- Some systems are direct (water flows through the collector) and others indirect (a heat-transfer fluid is used), which matters in areas with frost or hard water.

Most solar geysers have an electric backup element for cloudy days; a timer on that element prevents it from undoing the savings.

Replacing an electric geyser with a solar water heater often reduces the size and cost of any solar PV system you install afterwards, because the biggest load has been removed. Hard water in some areas can cause scaling, so ask suppliers about maintenance.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('energy-efficiency-at-home', 'Energy efficiency: cut consumption before you buy solar', 'energy-efficiency',
'Low-cost steps that reduce electricity use and make any solar system smaller and cheaper.',
$$Every kWh you do not use is a kWh you do not need to generate or store. Before sizing a solar system:

- Switch to LED lighting; it uses a fraction of the power of older bulbs.
- Put the electric geyser on a timer, lower its thermostat and insulate hot water pipes, or switch to a solar water heater.
- Replace very old fridges and freezers; they can use far more power than modern efficient models.
- Use inverter-type air conditioners and keep doors and windows closed while cooling.
- Use ceiling insulation and shading to keep homes cooler.
- Avoid leaving equipment on standby, and run pumps, washing machines and other heavy loads during sunny hours if you have solar.
- For boreholes, a properly sized solar pump with a storage tank often replaces grid or diesel pumping.

Efficiency measures usually pay back faster than any generation equipment and make backup batteries last longer during power cuts.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('renewable-energy-financing', 'Paying for solar: cash, loans, rental and rent-to-own', 'financing',
'The main ways to pay for a system and the questions to ask, without assuming any specific offer.',
$$Common ways to pay for renewable energy equipment:

Cash purchase gives the lowest total cost and full ownership from day one.

Bank or green loans: several banks offer loans for solar and energy-efficiency equipment, sometimes with better terms than personal loans. Terms, eligibility and approved suppliers vary by bank, so check directly with your bank.

Rent-to-own lets a customer pay monthly and own the equipment at the end of the term.

Rental or lease means paying to use equipment without owning it; maintenance is usually the provider's responsibility.

Pay-as-you-go (PAYG) systems, common for smaller solar home systems in Africa, are paid in small amounts (often by mobile money) and switch off if payments stop.

Energy-as-a-Service (EaaS) means paying for the energy or the service delivered rather than the equipment.

When comparing options ask: the total amount paid over the full term, who owns the equipment, who pays for maintenance and repairs, what happens if a payment is missed, and what warranty applies.

On ENERMO today, prices on product listings are purchase prices set by vendors. ENERMO-provided rental, rent-to-own, PAYG and EaaS are planned services and are not yet available through the website; contact ENERMO at hello@enermo.co.bw to ask about current options.$$, 'ENERMO EcoGuide', 'all'),

-- ------------------------------------------------------------
('using-enermo-marketplace', 'Using the ENERMO marketplace', 'enermo-marketplace',
'How to browse, compare and enquire about products on enermo.co.bw, based on the current platform.',
$$ENERMO (enermo.co.bw) is an online marketplace connecting customers in Botswana with clean energy vendors.

Browsing: the Marketplace lists products in categories including Solar Home Systems, Rooftop Solar, Inverters, Batteries, Solar Water Pumps, Portable Solar Kits, Commercial Solar and Biogas Systems. You can filter by category, price and stock, and search by name.

Product pages show the price in Botswana Pula (BWP) as set by the vendor, specifications such as brand, model, capacity and warranty, photos, and the vendor's name.

Enquiries: use "Send Inquiry" on a product page to send a question or quotation request directly to that vendor. Vendors respond to you directly.

Vendors: the Vendor Directory lists vendors with their profile pages. A Verified badge means ENERMO has reviewed the vendor's CIPA registration and BURS tax clearance documents.

Accounts: you can sign up with email or with Google. Customers can see their orders in their dashboard and manage their name, phone number and photo in Settings.

ENERMO does not install equipment itself; products and installation services are provided by the vendors listed on the platform. For help, use the Contact page or email hello@enermo.co.bw.$$, 'ENERMO', 'all'),

-- ------------------------------------------------------------
('becoming-an-enermo-vendor', 'Becoming an ENERMO vendor and listing products', 'enermo-vendors',
'How vendors register, set up a business profile, get verified and list products on ENERMO.',
$$Suppliers, installers and other clean energy businesses can sell through ENERMO.

1. Create an account: choose "Sell Products" on the sign-up page (or sign up with Google and choose the seller option).
2. Set up your business profile: in Settings, add your business name, description, contact details, city, website and logo. Your business profile must exist before you can list products.
3. Get verified: in Settings, upload your CIPA certificate (Certificate of Incorporation or Business Name Registration) and a current BURS Tax Clearance Certificate. ENERMO reviews documents, aiming to respond within 2 working days. When both are approved your profile and products show a Verified badge. If a document is rejected you will see the reason and can upload a new copy.
4. List products: in the vendor dashboard under Products, add a title, description, price in BWP, category, brand, model, capacity, warranty, stock and features, then add photos. Clear photos of the actual product and complete specifications help customers decide.
5. Respond to enquiries: customer enquiries appear in your vendor dashboard under Inquiries, and orders under Orders.

Writing a good listing: state the exact model and capacity, what is included (for example panels, inverter, batteries, mounting, installation), warranty terms, and delivery or installation areas.

ENERMO's commission or subscription terms are not published on the website; contact hello@enermo.co.bw for current vendor terms.$$, 'ENERMO', 'vendor'),

-- ------------------------------------------------------------
('enermo-services-and-roadmap', 'ENERMO services: what is available now and what is planned', 'enermo-services',
'What ENERMO offers on the website today, and services that are planned but not yet available online.',
$$Available on enermo.co.bw today:
- A marketplace of clean energy products from multiple vendors, with prices in BWP.
- A vendor directory with verified-vendor badges based on CIPA and BURS document checks.
- Enquiries from customers to vendors, and vendor dashboards to manage products, enquiries and orders.
- EcoGuide, an AI assistant for learning about clean energy, rough sizing estimates and finding listed products and vendors.

Planned services that are not yet available through the website:
- Equipment rental, rent-to-own and pay-as-you-go (PAYG) energy.
- Energy-as-a-Service (EaaS).
- IoT energy monitoring dashboards for solar, battery and biogas systems.
- Online maintenance, repair requests and job tracking.

Until these are launched, customers interested in them can contact ENERMO at hello@enermo.co.bw. EcoGuide should not promise prices, availability or timelines for planned services.$$, 'ENERMO', 'all')

on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  content = excluded.content,
  source = excluded.source,
  audience = excluded.audience;
