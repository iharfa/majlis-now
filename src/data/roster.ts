import type { Constituency, MP } from '@/types'

// ---------------------------------------------------------------------------
// REAL DATA — 20th People's Majlis roster.
// Source: https://majlis.gov.mv/en/20-parliament/members (fetched 2026-06).
//
// Names, constituencies, parties, photos and profile links are taken from the
// official site. Atoll groupings are derived (best-effort) for Find-your-MP;
// the constituency name is the authoritative locator. Attendance/voting records
// are NOT published as open data, so those MP fields are intentionally omitted.
// ---------------------------------------------------------------------------

const PHOTO_BASE = 'https://majlis.gov.mv/storage/members/'
const PROFILE_BASE = 'https://majlis.gov.mv/en/20-parliament/members/'

// [ name, constituency, atoll, partyId, photoHash, profileId, leadershipRole? ]
type Row = [string, string, string, string, string, string, string?]

const RAW: Row[] = [
  ['Hussain Shareef', "North Hulhumale'", 'Malé City', 'pnc', 'S8cL1FH911hlyysKuMoun5f401dUCrlfkb8iAXa4', '175'],
  ['Abdulla Shazeem', "Central Hulhumale'", 'Malé City', 'pnc', 'HprxQktStn4YF7VIqtWNcawJoNDdODyxDVUjJkWQ', '176'],
  ['Dr. Ahmed Shamheed', "South Hulhumale'", 'Malé City', 'mdp', 'wJ333PB8HpMdJttRqLtbpLLcxR0TeSejDd8JZ340', '177'],
  ['Ahmed Aifan', 'North Henveyru', 'Malé City', 'pnc', 'hXXCTzvqVLvipS4oWrcHNm60ro9coVACIW6dkjXA', '178'],
  ['Hussain Nasih', 'Central Henveyru', 'Malé City', 'pnc', 'A3R6uYERHgTVGzCPIf490sEFxHyO1hsVeNnHfGub', '179'],
  ['Hussain Imran Latheef', 'South Henveyru', 'Malé City', 'pnc', 'ARt0dP3Y0b6vtPbGuBf4ZIH4fBNkO6NRyajCPTP4', '180'],
  ['Ali Ibrahim', 'West Henveyru', 'Malé City', 'pnc', 'BlxD791zTIcWvDMTbqrhIM3yHuqkoNs5Y4MWrLcO', '181'],
  ['Mohamed Ibrahim', 'North Galolhu', 'Malé City', 'mdp', 'NmkszIpAYXeuFbigLMzUifHZB6ZLHsbKTjXv6gt4', '182'],
  ['Meekail Ahmed Nasym', 'South Galolhu', 'Malé City', 'mdp', 'tl35lCvVt6FxehD5THIAD798crc0SXMgi3aTEYaB', '183'],
  ['Ibrahim Muhammad', 'North Mahchangolhi', 'Malé City', 'pnc', 'Ltpw9yOYRTK0xYAVyDABN6WsgUdYb34wj28js9O6', '184'],
  ['Ahmed Xamyr', 'Central Mahchangolhi', 'Malé City', 'pnc', 'rRiyZwXMyqrEfzVazQgmRtju30RMxiwHgrQJoLym', '185'],
  ['Musthafa Hussain', 'South Mahchangolhi', 'Malé City', 'pnc', 'nQxPm22NZYyEcMdvNHkyts2wxuFyvVFYi8w669Kl', '186'],
  ['Mohamed Nazim', 'North Maafannu', 'Malé City', 'mnp', '6NViLIlFHLicjL3ZoL5kB3i2rKeZQcW6S8YQIoco', '187'],
  ['Asma Rasheed', 'Central Maafannu', 'Malé City', 'pnc', 'FSvWvPBzHTclBlcsrpnLsC4inM2FKmaYM09R9E9B', '188'],
  ['Abdulla Rifau', 'South Maafannu', 'Malé City', 'pnc', 'u2jUtXU0TTJbqIp4mgIy4dzR5FqW3mVQTGZeFqIq', '189'],
  ['Mohamed Musthafa Ibrahim', 'West Maafannu', 'Malé City', 'pnc', 'oQCV1xDKRQNKGaAuXLDWnQBuym7qGCRatv5qxA9D', '190'],
  ['Mohamed Ismail', "Vilimale'", 'Malé City', 'pnc', 'kICOYvCwhnBt9au53a51uH9h5sdbjpXK6RWSLdR4', '191'],
  ['Ali Moosa', 'Hoarafushi', 'Haa Alif', 'pnc', 'p8NEPO4GT9YEqIEQhPN7gUo4Eb5WS4nsSEq8jDAj', '192'],
  ['Ahmed Naseer', 'Ihavandhoo', 'Haa Alif', 'pnc', '9sEwYdiYSeDlANI6ScvKpStDxH97a8nPj17RlBQI', '193'],
  ['Ibrahim Shujau', 'Baarashu', 'Haa Alif', 'pnc', 'hEPDYLQL8LRHN39fsNBlqxVyR2T9r9EQ6QCHthXe', '194'],
  ['Abdul Latheef Mohamed', 'Dhidhdhoo', 'Haa Alif', 'pnc', 'HvSp3kNdy7N5I4DZjFerXrWKFUKOIozCznMhFPmT', '195'],
  ['Abdulla Shareef', 'Kelaa', 'Haa Alif', 'pnc', 'aZmXG4ApR0gbyFuOEmv8YmdlsREFR9kLGpSDjkL2', '196'],
  ['Abdul Gafoor Moosa', 'Hanimaadhoo', 'Haa Dhaalu', 'mdp', 'MiMShY0xEHgu927hBpYfrQTTBFUk3OWCblyWFqf8', '197'],
  ['Mohamed Rasheed', 'Nolhivaram', 'Haa Dhaalu', 'pnc', '4SdwAo19lylHhLjlaq8LtrRNYj6jeSU8y0X5EuzG', '198'],
  ['Hussain Ziyad', 'Vaikaradhoo', 'Haa Dhaalu', 'mdp', 'fzAL0aybIsl3dAGcV1Vi1hQBFJc21DNWJmKGFkmC', '199'],
  ['Mohamed Dawoodh', 'North Kulhudhuffushi', 'Haa Dhaalu', 'pnc', '8wtZaGSnBidKiNMxCnc4Aqmx8PPmscZdUx0cNgKH', '200'],
  ['Faruhath Mohamed', 'South Kulhudhuffushi', 'Haa Dhaalu', 'pnc', 'bNWnutjSA2r5lvyG06YFsWJbGNuFAdyrUaOD0Tnz', '201'],
  ['Adam Shafeeq', 'Makunudhoo', 'Haa Dhaalu', 'pnc', 'TCpuAgr41l8WNkF74FczEWISbyEbsnWzHqSHBNAd', '202'],
  ['Ameen Faisal', 'Kanditheemu', 'Shaviyani', 'mdp', '6FVGr3RVdxWoehxbmeTbaEmdnDoatbVUKdX8VqHS', '203'],
  ['Hassan Mufeed Abdul Gadir', 'Milandhoo', 'Shaviyani', 'pnc', '4X8L2AAM6U788BUX1t9qC6m54RxLBM4AXtfphGro', '204'],
  ['Mohamed Ibrahim', 'Komandoo', 'Shaviyani', 'pnc', 'ydhLrsAm4qWhpAxJrk47sVGoNWx2LIs60odkJ2Uv', '205'],
  ['Mohamed Mamdooh', 'Funadhoo', 'Shaviyani', 'pnc', 'TIYgZDfuQua1HGFU9hNXPau6MsV2wFgqnSk2eDvn', '206'],
  ['Mohamed Afoo Hamid', 'Kendhikulhudhoo', 'Noonu', 'pnc', 'NPgnbGzGKnC6uYYDWUzHOch2uwFIAdHhtzadzlZS', '207'],
  ['Husnee Mubarik', 'Manadhoo', 'Noonu', 'pnc', 'uxvMmu6VnERuNKpfTPPDoSRrYMM4HbzSZqc2x8wc', '208'],
  ['Mohamed Abbas', 'Velidhoo', 'Noonu', 'mda', '8lSGiioAapj0pnZTt7K5FX0R1tfuv7A5L0vyBjhR', '209'],
  ['Abdul Sattar Mohamed', 'Holhudhoo', 'Noonu', 'pnc', 'RVpxQzQHstVDYbla6JRnTRDDWTgvDY0pAMy0uCqh', '210'],
  ['Abdul Latheef Abdul Rahman', 'Alifushi', 'Raa', 'pnc', 'rZKZjE7noFLHQkeg0r6v2tvrIh1hJOkroUvLmsVa', '211'],
  ['Ibrahim Shifaz', 'Ungoofaaru', 'Raa', 'pnc', '2O2Is2oGsbgjsdkPUtts0joYKNyDYrlYGGSiGljA', '212'],
  ['Mohamed Ali', 'Dhuvaafaru', 'Raa', 'pnc', 'hFUZ26e8lA3SliiWciKpw7uPPEhvoFRJ8W3Gr37H', '213'],
  ['Ibrahim Falah', 'Inguraidhoo', 'Raa', 'pnc', '7i0PWYMdSeB9ea2Sh8dQxoGa1DgK6qKAzdz4amOF', '214', 'Majority Leader'],
  ['Ahmed Zahir', 'Maduvvari', 'Raa', 'pnc', 'UYX4KewOxTzFAPuTnllyOLxsYdFfbY404ed3RBjE', '215'],
  ['Abdul Hannan Aboobakuru', 'Thulhaadhoo', 'Baa', 'ind', 'MXPU22Avy7BsCyv4bWRAWZBKBIgnaVwru7YBBW56', '216'],
  ['Ahmed Saleem', 'Eydhafushi', 'Baa', 'pnc', 'h2oyJNIDii9wNWFlY7F5Jj69tqjthXZjvtvMNGBy', '217', 'Deputy Speaker'],
  ['Mauroof Zakir', 'Kendhoo', 'Baa', 'mdp', 'D1LLpfMQjVuPbEi2TR4SHybXSjuiYMAMxFVcaY4n', '218'],
  ['Mohamed Siruhaan', 'Hithaadhoo', 'Baa', 'pnc', 'GX5xcHKsSun1Fx5G2H5WC95khaG7G1J3OL0AJOsm', '219'],
  ['Mohamed Abdul Rahman', 'Hinnavaru', 'Lhaviyani', 'pnc', 'iPR3r5JGKdlZNzHm96BG253zsWHbaqCViRqsy5jV', '220'],
  ['Yaaseen Abdulla', 'Naifaru', 'Lhaviyani', 'pnc', '1nwSILWH6q4BL8wA1XRyz3kRNVja4Y8aAc96sOQO', '221'],
  ['Mohamed Shamin Habeeb', 'Kurendhoo', 'Lhaviyani', 'pnc', 'P60rng93jJYLzjGqobnkMQUQpi2ULmOSpgqCXT7p', '222'],
  ['Munthazim Ibrahim', 'Kaashidhoo', 'Kaafu', 'pnc', 'ceRdzQhnkLnH4rkH93UYpZaTjz6Zm5gie65gTrhz', '223'],
  ['Ibrahim Naseem', 'Thulusdhoo', 'Kaafu', 'pnc', 'NZcPy8abGWSxb0RDuHbZmfDpZ2MIyf2lM4vNC2wJ', '224'],
  ['Hussain Riza Adam', 'Maafushi', 'Kaafu', 'pnc', 'CaSKl6EZ4TPfkYDrg0e7Rnkga3S7JsrokzCm52Wq', '225'],
  ['Dr. Anara Naeem', 'Huraa', 'Kaafu', 'pnc', 'cCXEL8boLaQ1ofqPWPin4Kbv46EtFIt2vFodcswq', '227'],
  ['Hassan Zareer', 'Mathiveri', 'Alif Alif', 'pnc', 'wR9Ay8EMG0ZizNT72UNbLPrHSk6PaIx2h5poahzY', '228'],
  ['Hussain Sameer', 'Thoddoo', 'Alif Alif', 'mdp', 'dhrzS1agARC771v5H6mQWD8nR37GjfMsMB0MuJS1', '230'],
  ['Qasim Ibrahim', 'Maamigili', 'Alif Dhaal', 'jp', '77xqDeGK38rN0b9PSwNpsA1sFWDe6cavAS5rDtGk', '232'],
  ['Ahmed Thariq', 'Mahibadhoo', 'Alif Dhaal', 'pnc', 'ZSD2zRjdnIRtDiINjaylKto16u5GSiDvgHsMRZv8', '234'],
  ['Abdulla Rasheed', 'Dhangethi', 'Alif Dhaal', 'pnc', '83vZ3rQIdPcUxWKooG50iqsSO4vINpQELAKjJ0cW', '235'],
  ['Adam Zahir', 'Felidhoo', 'Vaavu', 'pnc', 'fD2La3eJ41ejtkn6IRQLcm7K8ovsXfs46voYB9f5', '236'],
  ['Mohamed Niushad', 'Keyodhoo', 'Vaavu', 'mdp', 'lX32P2XkNGWaBBbYzL0Wq75gvdEy6yZCCsMXYAc6', '238'],
  ['Ahmed Nazim', 'Dhiggaru', 'Meemu', 'pnc', 'XD942ig5TFVuA0ZOBkGSFNiwxCZxp434iRuOoBe5', '240'],
  ['Ibrahim Naufal', 'Mulaku', 'Meemu', 'pnc', 'aavW0VowpC0D1w9eiyB8exogM1l1uWh9qmr7VXkO', '241'],
  ['Ahmed Aslam', 'Bilehdhoo', 'Faafu', 'pnc', 'JxOutDP8QTA0UOIyOolrdi6TZAhGDRs2GMlyKC81', '243'],
  ['Fathimath Sauda', 'Nilandhoo', 'Faafu', 'pnc', 'HQCxGldPqjJLzIYbjgPNppcoYiw6WTyZvJiJdIWf', '245'],
  ['Ahmed Siyam Mohamed', 'Meedhoo', 'Dhaalu', 'mda', '13LOiT1R8eKQUnFAi3vfensXVzZrhbhaXRnWCDs8', '246'],
  ['Hussain Hameed', 'Kudahuvadhoo', 'Dhaalu', 'pnc', 'ZDygyhqSl5d7EcaOZdSnR506SzDUJJc6IuKZrvUF', '248'],
  ['Hassan Waheed', 'Vilifushi', 'Thaa', 'pnc', 'jtn9117FnOY9hvUoMzSzBBFPNGaE0LIbYt2lZMLT', '250'],
  ['Ahmed Riyaz', 'Thimarafushi', 'Thaa', 'pnc', 'IojiW3p88cgn6Dr3VazKVyjir8DNzXfLtH1pFomg', '251'],
  ['Ali Ashrag', 'Kinbidhoo', 'Thaa', 'pnc', '5XWVieEmIrRa5ToJrYRAiHx2mnOYXA30fMLiSwnR', '253'],
  ['Hanan Mohamed Rasheed', 'Guraidhoo', 'Thaa', 'pnc', 'srr8M3ni2zd4iYQG438apESAQpzTOO5TE8aL0iIS', '254'],
  ['Ismail Shafeeu', 'Isdhoo', 'Laamu', 'pnc', '882LymjXhbYopJlYAsdBc3CBMJcIUS2Bb3fO3t76', '255'],
  ['Yoosuf Nasheed', 'Gan', 'Laamu', 'pnc', 'Ph5kA44nUAvC58XlxtiJlK4I6bXm8ZG1yC8H5MIO', '257'],
  ['Abdul Raheem Abdulla', 'Fonadhoo', 'Laamu', 'pnc', 'VGM68HOVfEFyoBVbd34PPC7gwZFIRmT9RczYFcwA', '259', 'Speaker'],
  ['Ahmed Shakir', 'Maavashu', 'Laamu', 'mdp', '26B5uZumMRhSWmOyl9DDUZk2vLY0Rctenk6ZgmkZ', '260'],
  ['Azim Abdul Azeez', 'Vilingili', 'Gaafu Alif', 'pnc', 'dWFNwo9iGoG4j5GB9IBhFSQH1ClcKkbPwGANfQBx', '262'],
  ['Mohamed Fazeel', 'Dhaandhoo', 'Gaafu Alif', 'pnc', '4UfYo2q4y6dyl1RbPLhQiZevj41wGyvqFmL9w4sU', '264'],
  ['Asadhulla Shihab', 'Gemanafushi', 'Gaafu Alif', 'pnc', 'jmTTap6SJweXdMGjILNEXyA5rJceLwUsPXxwTMzV', '266'],
  ['Ibrahim Didi', 'Kolamaafushi', 'Gaafu Alif', 'pnc', 'hu7DiLgnNXGaisXyhjquqYN7JEYuNipRfog3oxBm', '267'],
  ['Saudulla Hilmy', 'North Thinadhoo', 'Gaafu Dhaalu', 'pnc', 'Ht7HmoKLdqjaCdWV6iUIil7yRZt7uiPW3tYd7gAs', '265'],
  ['Mohamed Alsan Ahmed', 'South Thinadhoo', 'Gaafu Dhaalu', 'pnc', 'XKszLZhvYx916LX07L0Q9Dc8tG89tUns7OU2if5j', '263'],
  ['Mohamed Shameez', 'Madaveli', 'Gaafu Dhaalu', 'pnc', 'ymt2LDIrcGChnYsMITZhS9jDNJM8IuhJ5UTgmIFC', '261'],
  ['Ashraf Rasheed', 'Faresmaathodaa', 'Gaafu Dhaalu', 'pnc', 'Sdil1bgJf0nB0nsFg8DtNyKB9vqp0bXRe2qYBdQH', '258'],
  ['Mohamed Ali', 'Gadhdhoo', 'Gaafu Dhaalu', 'pnc', 'iAZfTVkoKRfpm9MREQegUB583BWLQeIm0s6jU3NM', '256'],
  ['Hamad Abdulla', 'North Fuvahmulah', 'Fuvahmulah City', 'pnc', '4l4nfb3yEHOziL8dBpKKvzCHI0KySHqo0THzlnXI', '252'],
  ['Ali Fazad', 'Central Fuvahmulah', 'Fuvahmulah City', 'pnc', 'Nq99gcXSMmUD6bhmgkqFprLT41ODYvynRkC2JskQ', '249'],
  ['Ibrahim Hussain', 'South Fuvahmulah', 'Fuvahmulah City', 'pnc', '1bk8KQO2PkfUPPicrvxPhl01bjbXCutOoHWalvHi', '247'],
  ['Mohamed Shahid', 'Hulhudhoo', 'Addu City', 'pnc', 'oczfSGpPuOp4SGhIAb8j7T1EYb4mCpeBXzsTKHS7', '244'],
  ['Ismail Nizar', 'North Feydhoo', 'Addu City', 'pnc', 'trXooLAyp31GEMo6OzWKr3duzsLlaMrCJv3wJxG3', '242'],
  ['Ibrahim Didi', 'South Feydhoo', 'Addu City', 'pnc', 'nfkyWxILJinFhF7G0oEZJ0FEmAJ8YadKclwUGdZ9', '239'],
  ['Ahmed Didi', 'Maradhoo', 'Addu City', 'mdp', 'CBGUsWPEUEbXWfVWnHRkRQiEInBQMRYbzktLrcQQ', '237'],
  ['Ahmed Azaan Marzooq', 'Central Hithadhoo', 'Addu City', 'pnc', 'qWe4pJV10K9uMKWBK7PiYiqfxohNrjSZxfV03SQo', '231'],
  ['Ibrahim Nazil', 'South Hithadhoo', 'Addu City', 'mdp', 'AuqET4joR0k0pLAIr3fm57iboHcedGkP6H62u912', '229', 'Minority Leader'],
  ['Abdul Rahman', 'Addu Meedhoo', 'Addu City', 'ind', 'QrSAHOyjySGGyj0QXjfMnrbFOVxhvThdLGQvATfh', '226'],
]

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// --- Build constituencies (one per row, unique) -----------------------------
export const constituencies: Constituency[] = RAW.map(([, con, atoll]) => ({
  id: slug(con),
  name: con,
  atoll,
  islands: [con.replace(/^(North|Central|South|West)\s+/, '')],
}))

export const constituencyById = (id: string) => constituencies.find((c) => c.id === id)

// --- Build MPs --------------------------------------------------------------
export const mps: MP[] = RAW.map(([name, con, , partyId, photoHash, pid, role]) => ({
  id: `mp-${pid}`,
  name,
  initials: initials(name),
  photoUrl: PHOTO_BASE + photoHash + '.jpg',
  profileUrl: PROFILE_BASE + pid,
  constituencyId: slug(con),
  partyId,
  leadershipRole: role,
  active: true,
  sources: [
    {
      id: `src-mp-${pid}`,
      label: 'Official member profile — People’s Majlis',
      url: PROFILE_BASE + pid,
      lastUpdated: '2026-06-12',
      kind: 'official',
    },
  ],
}))

export const mpById = (id: string) => mps.find((m) => m.id === id)
