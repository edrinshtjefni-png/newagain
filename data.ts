import { Salon } from './types';

export const INITIAL_SALONS: Salon[] = [
  {
    id: '1',
    name: 'Aura Hair Studio',
    type: 'Hair Salon',
    description: 'A boutique hair salon specializing in modern coloring, customized cuts, and premium hair restoration treatments. Our expert stylists curate bespoke looks designed to highlight your natural elegance.',
    rating: 4.9,
    reviewCount: 428,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    address: 'Rykkinn Senter, Munins vei 1, 1349 Rykkinn',
    hours: 'Mon - Sat: 9:00 AM - 8:00 PM • Sun: Closed',
    services: [
      {
        id: 's101',
        name: "Women's Precision Haircut & Blow Dry",
        duration: 60,
        price: 95,
        description: 'Includes luxurious shampoo, deep conditioning mask, head massage, precision haircut, and custom blowout style.',
        category: 'Hair'
      },
      {
        id: 's102',
        name: 'Bespoke Balayage & Tone',
        duration: 180,
        price: 240,
        description: 'Hand-painted natural highlights customized to your hair flow, followed by a gloss toner for a seamless, radiant finish.',
        category: 'Hair'
      },
      {
        id: 's103',
        name: "Men's Modern Cut & Style",
        duration: 45,
        price: 55,
        description: 'Full consultation, cleansing wash, tailored haircut, hot towel finish, and professional styling with premium clay or pomade.',
        category: 'Hair'
      },
      {
        id: 's104',
        name: 'Signature Silk Keratin Treatment',
        duration: 120,
        price: 180,
        description: 'Smoothing treatment designed to eliminate frizz, seal hair cuticles, and restore deep shine for up to 12 weeks.',
        category: 'Hair'
      }
    ],
    stylists: [
      {
        id: 'st101',
        name: 'Sofia Chen',
        role: 'Master Colorist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st102',
        name: 'James Carter',
        role: 'Senior Stylist',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st103',
        name: 'Liam Davies',
        role: 'Creative Director',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Luxe Nail Lounge',
    type: 'Nail Salon',
    description: 'An elegant retreat dedicated to the art of luxury nail care. We prioritize non-toxic products, medical-grade sanitization, and impeccable hand-painted nail artistry.',
    rating: 4.8,
    reviewCount: 312,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    address: 'Sandvika Storsenter, Sandviksveien 176, 1337 Sandvika',
    hours: 'Daily: 10:00 AM - 7:30 PM',
    services: [
      {
        id: 's201',
        name: 'Signature Gel Manicure',
        duration: 45,
        price: 55,
        description: 'Includes nail shaping, cuticle therapy, light hand massage, and long-lasting non-toxic LED gel color of your choice.',
        category: 'Nails'
      },
      {
        id: 's202',
        name: 'Elysian Botanical Pedicure',
        duration: 60,
        price: 75,
        description: 'Warm organic herb soak, mineral scrub exfoliation, clarifying clay mask, hydrating massage, and precision nail grooming.',
        category: 'Nails'
      },
      {
        id: 's203',
        name: 'Gel-X Extensions with Custom Art',
        duration: 90,
        price: 120,
        description: 'Premium soft-gel full cover extensions tailored to your length, plus 2-4 accent nails of customized, hand-painted art.',
        category: 'Nails'
      }
    ],
    stylists: [
      {
        id: 'st201',
        name: 'Emily Rossi',
        role: 'Nail Artist Specialist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st202',
        name: 'Chloe Zhang',
        role: 'Senior Nail technician',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Soma Wellness & Massage',
    type: 'Massage & Body',
    description: 'A serene sanctuary designed to restore mind-body equilibrium. Our licensed therapists specialize in deep tissue, therapeutic, and relaxation massage modalities.',
    rating: 4.9,
    reviewCount: 562,
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80',
    address: 'Bogstadveien 30, 0355 Oslo',
    hours: 'Daily: 8:00 AM - 9:00 PM',
    services: [
      {
        id: 's301',
        name: 'Deep Tissue Recovery Massage',
        duration: 60,
        price: 110,
        description: 'Focused, deep pressure targeting chronic muscle tension, knots, and tightness. Perfect for athletic recovery or posture release.',
        category: 'Massage'
      },
      {
        id: 's302',
        name: 'Swedish Relaxation Ritual',
        duration: 90,
        price: 140,
        description: 'Fluid, flowing strokes using warm aromatherapy oils to soothe the nervous system, boost circulation, and induce pure calm.',
        category: 'Massage'
      },
      {
        id: 's303',
        name: 'Volcanic Hot Stone Therapy',
        duration: 75,
        price: 135,
        description: 'Utilizes smooth basalt river stones heated to perfect temperature to melt tension from deep within muscle tissue.',
        category: 'Massage'
      }
    ],
    stylists: [
      {
        id: 'st301',
        name: 'Marcus Vance',
        role: 'Therapeutic Massage Specialist',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st302',
        name: 'Elena Petrova',
        role: 'Aromatherapy Specialist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'The Golden Razor',
    type: 'Barbershop',
    description: 'Combining time-honored barbering techniques with modern precision cuts. Enjoy a complimentary espresso or single-malt whiskey with every premium groom.',
    rating: 4.7,
    reviewCount: 198,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    address: 'Thorvald Meyers gate 48, 0552 Oslo',
    hours: 'Tue - Sat: 10:00 AM - 8:00 PM • Sun: 11:00 AM - 4:00 PM',
    services: [
      {
        id: 's401',
        name: 'Tailored Haircut & Razor Finish',
        duration: 40,
        price: 45,
        description: 'Expert fade, crop, or taper, detailed with a straight razor neck shave and premium styling.',
        category: 'Hair'
      },
      {
        id: 's402',
        name: 'Hot Towel Beard Grooming & Sculpt',
        duration: 30,
        price: 35,
        description: 'Beard trim, line-up, and razor detailing, complete with nourishing beard oil massage and warm towel wrap.',
        category: 'Hair'
      },
      {
        id: 's403',
        name: 'The Royal Hot Towel Shave',
        duration: 50,
        price: 60,
        description: 'Traditional straight-razor shave with pre-shave oils, rich lather, double-shave pass, cooling mask, and calming cold towels.',
        category: 'Hair'
      }
    ],
    stylists: [
      {
        id: 'st401',
        name: 'Dominic Vane',
        role: 'Master Barber',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st402',
        name: 'Mateo Lopez',
        role: 'Senior Barber',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '5',
    name: 'Prism Brow & Lash Bar',
    type: 'Eyebrows & Lashes',
    description: 'Expert lash lifts, custom tinting, and brow laminations designed to frame your unique features. Wake up feeling effortlessly put-together.',
    rating: 4.8,
    reviewCount: 224,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    address: '104 Karl Johans gate, 0154 Oslo',
    hours: 'Mon - Sat: 9:30 AM - 7:00 PM',
    services: [
      {
        id: 's501',
        name: 'Lash Lift & Keratin Tint',
        duration: 60,
        price: 85,
        description: 'Boosts, curls, and darkens your natural lashes. Results last up to 6-8 weeks with zero daily maintenance.',
        category: 'Brows & Lashes'
      },
      {
        id: 's502',
        name: 'Bespoke Brow Lamination & Tint',
        duration: 45,
        price: 70,
        description: 'Smooths, sets, and fills in brows for a fuller, symmetrical feathered look.',
        category: 'Brows & Lashes'
      },
      {
        id: 's503',
        name: 'Full Set Classic Lash Extensions',
        duration: 120,
        price: 150,
        description: 'Meticulous 1-to-1 application of high-quality silk extensions for soft, natural length and elegance.',
        category: 'Brows & Lashes'
      }
    ],
    stylists: [
      {
        id: 'st501',
        name: 'Maya Patel',
        role: 'Lash Specialist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st502',
        name: 'Naomi Brooks',
        role: 'Brow Sculpt Expert',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '6',
    name: 'Nirvana Thermal Spa',
    type: 'Spa',
    description: 'A sanctuary of deep relaxation and wellness. Unwind in our thermal mineral baths, detoxify in the herbal saunas, and nurture your skin with our cellular-level organic facials.',
    rating: 4.9,
    reviewCount: 389,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    address: 'Bygdøy allé 9, 0262 Oslo',
    hours: 'Daily: 8:00 AM - 10:00 PM',
    services: [
      {
        id: 's601',
        name: 'Hydrating Botanical Cellular Facial',
        duration: 60,
        price: 125,
        description: 'Deep cleansing, double exfoliation, custom serum infusion, and chilled quartz jade rolling for structural lift and glow.',
        category: 'Spa'
      },
      {
        id: 's602',
        name: 'Dead Sea Minerals Mud Wrap',
        duration: 90,
        price: 165,
        description: 'Full body dry brush exfoliation, mineral-rich warm clay mask application, followed by thermal blanket wrap and light scalp massage.',
        category: 'Spa'
      },
      {
        id: 's603',
        name: 'Thermal Pass & Essential Oils Back Relief',
        duration: 90,
        price: 145,
        description: 'Includes a 2-hour pass to the steam rooms, salt saunas, and hot pools, combined with a targeted 30-minute essential oils massage.',
        category: 'Spa'
      }
    ],
    stylists: [
      {
        id: 'st601',
        name: 'Amelia Thorne',
        role: 'Lead Aesthetician',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      },
      {
        id: 'st602',
        name: 'Sarah Jenkins',
        role: 'Spa Therapy Director',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '7',
    name: 'Fjord Spa & Wellness',
    type: 'Spa',
    description: 'A premium therapeutic spa overlooking the historic Bryggen, offering world-class Nordic hot-stone massage and replenishing seaweed body wraps.',
    rating: 4.9,
    reviewCount: 312,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    address: 'Bryggen 13, 5003 Bergen',
    hours: 'Daily: 9:00 AM - 9:00 PM',
    services: [
      {
        id: 's701',
        name: 'Nordic Hot Stone Relaxation Massage',
        duration: 75,
        price: 135,
        description: 'Soothing massage using polished, heated basalt stones placed on key energy points to melt away tension.',
        category: 'Massage'
      },
      {
        id: 's702',
        name: 'Organic Norwegian Fjord Seaweed Wrap',
        duration: 90,
        price: 155,
        description: 'A luxurious body exfoliation followed by a warm, nutrient-rich seaweed wrap to detoxify and hydrate your skin.',
        category: 'Spa'
      }
    ],
    stylists: [
      {
        id: 'st701',
        name: 'Ingrid Hansen',
        role: 'Senior Spa Therapist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '8',
    name: 'Nidaros Barber & Salon',
    type: 'Hair Salon',
    description: 'Trondheim’s premier destination for masterful classic cuts, luxury hot-towel beard grooms, and custom styling for the modern individual.',
    rating: 4.8,
    reviewCount: 174,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    address: 'Munkegata 20, 7011 Trondheim',
    hours: 'Mon - Fri: 9:00 AM - 6:00 PM • Sat: 10:00 AM - 4:00 PM',
    services: [
      {
        id: 's801',
        name: 'Signature Haircut & Charcoal Scalp Therapy',
        duration: 60,
        price: 75,
        description: 'Precision haircut combined with an invigorating deep-cleanse charcoal scalp massage and hot-towel refreshment.',
        category: 'Hair'
      },
      {
        id: 's802',
        name: 'Viking Beard Sculpt & Straight Razor Shave',
        duration: 45,
        price: 60,
        description: 'Traditional straight-razor shave around cheeks/neck with meticulous beard conditioning and hot towel treatment.',
        category: 'Hair'
      }
    ],
    stylists: [
      {
        id: 'st801',
        name: 'Lars Thoresen',
        role: 'Master Barber',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '9',
    name: 'Viking Hair & Beard',
    type: 'Hair Salon',
    description: 'Located in Stavanger’s iconic colorful Fargegaten, we blend heritage styling with cutting-edge modern color, cuts, and texturizing.',
    rating: 4.9,
    reviewCount: 205,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    address: 'Øvre Holmegate 12, 4006 Stavanger',
    hours: 'Tue - Sat: 10:00 AM - 7:00 PM',
    services: [
      {
        id: 's901',
        name: 'Full Color Transformation & Cut',
        duration: 150,
        price: 195,
        description: 'Complete hair redesign including consultation, expert color application, gloss overlay, and styling.',
        category: 'Hair'
      }
    ],
    stylists: [
      {
        id: 'st901',
        name: 'Astrid Dahl',
        role: 'Senior Stylist & Colorist',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '10',
    name: 'Arctic Glow Aesthetics',
    type: 'Eyebrows & Lashes',
    description: 'High-precision aesthetics in the heart of Tromsø. Specializing in stunning brow laminations, luxury lash extensions, and cold-pressed facial lifts designed for the subarctic climate.',
    rating: 4.9,
    reviewCount: 142,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    address: 'Storgata 64, 9008 Tromsø',
    hours: 'Mon - Sat: 10:00 AM - 6:00 PM',
    services: [
      {
        id: 's1001',
        name: 'Arctic Ice Hydrating Facial Lift',
        duration: 60,
        price: 115,
        description: 'Cryo-therapy facial massage using chilled globes to reduce inflammation and deeply infuse hydrating botanicals.',
        category: 'Spa'
      },
      {
        id: 's1002',
        name: 'Midnight Sun Lash & Brow Combo',
        duration: 90,
        price: 135,
        description: 'Simultaneous lash lift & tint combined with premium brow lamination to define and illuminate your eyes.',
        category: 'Brows & Lashes'
      }
    ],
    stylists: [
      {
        id: 'st1001',
        name: 'Freja Amundsen',
        role: 'Lead Aesthetician',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  },
  {
    id: '11',
    name: 'Sørlandets Velvet',
    type: 'Nail Salon',
    description: 'Kristiansand’s premier sunlit nail sanctuary, dedicated to exquisite organic gel manicures, luxury spa pedicures, and intricate hand-painted nail art.',
    rating: 4.8,
    reviewCount: 118,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    address: 'Markens gate 25, 4611 Kristiansand',
    hours: 'Daily: 9:00 AM - 7:00 PM',
    services: [
      {
        id: 's1101',
        name: 'Kristiansand Velvet Pedicure',
        duration: 60,
        price: 70,
        description: 'Hydrating sea-salt soak, custom citrus sugar exfoliation, intensive heel therapy, and flawless gel-polish finish.',
        category: 'Nails'
      }
    ],
    stylists: [
      {
        id: 'st1101',
        name: 'Linnea Berg',
        role: 'Lead Nail Artist',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        expertise: ['Precision Cutting', 'Balayage', 'Color Correction'],
        portfolio: [
          'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=400&q=80'
        ],
        testimonials: [
          { id: 't1_' + Math.random().toString(36).substr(2, 5), clientName: 'Jessica L.', rating: 5, comment: 'Absolutely amazing! Best style I have ever had.' },
          { id: 't2_' + Math.random().toString(36).substr(2, 5), clientName: 'Sarah M.', rating: 5, comment: 'So professional and talented. Highly recommend!' }
        ]
      }
    ]
  }
];

export const SERVICE_CATEGORIES = [
  { name: 'Hair', icon: 'Scissors', salons: ['1', '4', '8', '9'] },
  { name: 'Nails', icon: 'Sparkles', salons: ['2', '11'] },
  { name: 'Massage', icon: 'Hand', salons: ['3', '6', '7'] },
  { name: 'Spa', icon: 'Activity', salons: ['6', '7', '10'] },
  { name: 'Brows & Lashes', icon: 'Eye', salons: ['5', '10'] }
];

export const INITIAL_USER: { name: string; email: string; phone: string; avatar: string; favorites: string[] } = {
  name: 'Alex Rivera',
  email: 'alex.rivera@gmail.com',
  phone: '+1 (555) 019-2834',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  favorites: ['1', '3']
};
