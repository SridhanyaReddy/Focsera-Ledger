const API_URL = 'http://localhost:5050/api';

async function main() {
  // 1. Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@focsera.in', password: 'Admin@Focsera2026' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) {
    console.error('Failed to log in:', loginData);
    return;
  }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 2. Fetch Divisions
  const divRes = await fetch(`${API_URL}/divisions`, { headers });
  const divData = await divRes.json();
  const divisions = divData.data || [];
  const divMap = {};
  divisions.forEach(d => { divMap[d.code] = d._id; });

  // 3. Create Sample Services
  const services = [
    { name: 'Luxury Stage & Mandap Decoration', divisionCode: 'focsera-celebrate', category: 'Events', defaultRate: 75000, unitType: 'per event' },
    { name: 'Cinematic Wedding Film & Photography', divisionCode: 'focsera-celebrate', category: 'Events', defaultRate: 120000, unitType: 'per event' },
    { name: 'DJ, Sound & Intelligent Truss Lighting', divisionCode: 'focsera-celebrate', category: 'Events', defaultRate: 35000, unitType: 'per evening' },
    { name: 'Commercial Product Photography & Retouching', divisionCode: 'focsera-create', category: 'Studios', defaultRate: 45000, unitType: 'per shoot' },
    { name: 'Social Media Management & Creative Retainer', divisionCode: 'focsera-market', category: 'Marketing', defaultRate: 40000, unitType: 'per month' },
    { name: 'Full-Stack Custom Web Platform Development', divisionCode: 'focsera-grow', category: 'Digital', defaultRate: 85000, unitType: 'per project' },
    { name: 'Corporate Brand Identity & Visual Design Kit', divisionCode: 'media-and-branding', category: 'Digital', defaultRate: 35000, unitType: 'per package' },
    { name: 'Turnkey Luxury Apartment Interior Execution', divisionCode: 'focsera-interiors', category: 'Interiors', defaultRate: 450000, unitType: 'per unit' }
  ];

  for (const s of services) {
    if (divMap[s.divisionCode]) {
      await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: s.name,
          divisionId: divMap[s.divisionCode],
          category: s.category,
          defaultRate: s.defaultRate,
          unitType: s.unitType,
          taxPercentage: 18
        })
      });
    }
  }
  console.log('✓ Services seeded.');

  // 4. Create Client 1
  const client1Res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Dr. Ramesh & Sunita Verma',
      companyName: 'Verma Healthcare & Diagnostics',
      email: 'dr.verma@vermahealth.in',
      phone: '+91 98490 12345',
      clientType: 'Individual',
      billingAddress: {
        street: 'Villa 14, Palm Meadows, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        stateCode: '36',
        postalCode: '500033'
      },
      gstin: '36AABCU9603R1ZM',
      state: 'Telangana',
      stateCode: '36'
    })
  });
  const client1Data = await client1Res.json();
  const client1Id = client1Data.data?._id;

  // 5. Create Project 1
  const proj1Res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Verma Grand Jubilee Wedding & Reception',
      client: client1Id,
      division: divMap['focsera-celebrate'],
      serviceCategory: 'Events & Celebrations',
      description: 'End-to-end luxury wedding decor, cinematic coverage, and DJ coordination at Taj Krishna.',
      startDate: '2026-04-10',
      expectedCompletionDate: '2026-04-15',
      agreedProjectValue: 250000,
      paymentTerms: '50% advance booking, 30% pre-event, 20% on delivery'
    })
  });
  const proj1Data = await proj1Res.json();
  const proj1Id = proj1Data.data?._id;

  // 6. Create Invoice 1
  const inv1Res = await fetch(`${API_URL}/invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      invoiceType: 'Tax Invoice',
      client: client1Id,
      project: proj1Id,
      division: divMap['focsera-celebrate'],
      invoiceDate: '2026-04-02',
      dueDate: '2026-04-20',
      placeOfSupply: 'Telangana',
      placeOfSupplyStateCode: '36',
      items: [
        {
          serviceName: 'Luxury Stage & Mandap Decoration',
          description: 'Custom royal theme with fresh exotic floral arches and ambient lighting.',
          quantity: 1,
          rate: 120000,
          discount: 10000,
          taxPercentage: 18
        },
        {
          serviceName: 'Cinematic Wedding Film & Photography',
          description: '3-day 4K coverage, drone, candid cinematography, and customized luxury album.',
          quantity: 1,
          rate: 130000,
          discount: 0,
          taxPercentage: 18
        }
      ],
      notes: 'Thank you for choosing Focsera Celebrate for your wedding occasion.'
    })
  });
  const inv1Data = await inv1Res.json();
  const inv1Id = inv1Data.data?._id;

  // 7. Record Advance Payment for Invoice 1
  await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clientId: client1Id,
      projectId: proj1Id,
      invoiceId: inv1Id,
      amount: 100000,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Advance',
      referenceNumber: 'HDFC-TXN-90214812',
      paymentDate: '2026-04-03',
      notes: 'Initial booking advance paid via NEFT.'
    })
  });
  console.log('✓ Invoice & Payment recorded for Client 1.');

  // 8. Create Client 2
  const client2Res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'AeroTech Systems Pvt Ltd',
      companyName: 'AeroTech Systems',
      email: 'finance@aerotechsys.com',
      phone: '+91 99887 76655',
      clientType: 'Business',
      billingAddress: {
        street: '8th Floor, Cyber Towers, HITEC City',
        city: 'Hyderabad',
        state: 'Telangana',
        stateCode: '36',
        postalCode: '500081'
      },
      gstin: '36AAACA1122B1Z8',
      state: 'Telangana',
      stateCode: '36'
    })
  });
  const client2Data = await client2Res.json();
  const client2Id = client2Data.data?._id;

  // 9. Create Project 2
  const proj2Res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'AeroTech Corporate Web Platform & Brand Relaunch',
      client: client2Id,
      division: divMap['focsera-grow'],
      serviceCategory: 'Business & Digital',
      description: 'Brand identity system, cloud dashboard, and interactive responsive company website.',
      startDate: '2026-04-05',
      expectedCompletionDate: '2026-05-15',
      agreedProjectValue: 120000
    })
  });
  const proj2Data = await proj2Res.json();
  const proj2Id = proj2Data.data?._id;

  // 10. Create Quotation for Project 2
  await fetch(`${API_URL}/quotations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      client: client2Id,
      project: proj2Id,
      division: divMap['focsera-grow'],
      quotationDate: '2026-04-05',
      validUntil: '2026-05-05',
      items: [
        {
          serviceName: 'Full-Stack Custom Web Platform Development',
          description: 'Scalable corporate web portal with headless CMS.',
          quantity: 1,
          rate: 85000,
          discount: 0,
          taxPercentage: 18
        },
        {
          serviceName: 'Corporate Brand Identity & Visual Design Kit',
          description: 'Comprehensive design guidelines and vector library.',
          quantity: 1,
          rate: 35000,
          discount: 0,
          taxPercentage: 18
        }
      ],
      paymentTerms: '50% advance, 50% on final launch.',
      notes: 'All code and brand IP ownership transfers to client upon completion.'
    })
  });
  console.log('✓ Quotation recorded for Client 2.');

  console.log('=== POPULATION COMPLETE ===');
}

main().catch(console.error);

