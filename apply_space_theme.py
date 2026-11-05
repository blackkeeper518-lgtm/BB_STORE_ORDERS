from pathlib import Path

p = Path('/tmp/bbcheck/repo/docs/client/src/pages/SecretGallery.tsx')
s = p.read_text()

def replace(old, new, count=1):
    global s
    if s.count(old) < count:
        raise SystemExit(f'missing replacement: {old[:100]!r}')
    s = s.replace(old, new, count)

replace(
'''      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center bg-[#090611] p-4 text-white">
        <Card className="neon-card w-full max-w-md rounded-3xl border-fuchsia-400/30 bg-[#130b1e]">''',
'''      <div className="relative flex min-h-[calc(100vh-2rem)] items-center justify-center overflow-hidden bg-[#02030d] p-4 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.16),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(217,70,239,.18),transparent_32%),linear-gradient(135deg,#02030d,#10051c_55%,#020a16)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1px),radial-gradient(circle,rgba(34,211,238,.7)_1px,transparent_1px)] [background-position:10px_18px,70px_60px] [background-size:130px_130px,190px_190px]" />
        <Card className="neon-card relative z-10 w-full max-w-md rounded-3xl border-cyan-300/35 bg-[#080b1c]/85 shadow-[0_0_55px_rgba(34,211,238,.16),0_0_110px_rgba(217,70,239,.12)] backdrop-blur-xl">''')
replace(
'''    <div className="secret-gallery-page cyber-grid h-[100dvh] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#090611] p-2 text-white sm:p-4 lg:p-6">
      <div className="mx-auto min-w-0 max-w-[1500px] space-y-4">
        <header className="neon-card relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[#130b1e] p-5 sm:p-6">''',
'''    <div className="secret-gallery-page relative isolate h-[100dvh] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#02030d] p-2 text-white sm:p-4 lg:p-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_18%_8%,rgba(34,211,238,.16),transparent_32%),radial-gradient(ellipse_at_85%_22%,rgba(217,70,239,.16),transparent_34%),radial-gradient(ellipse_at_48%_100%,rgba(59,130,246,.12),transparent_38%),linear-gradient(135deg,#02030d_0%,#08051a_48%,#020914_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-45 [background-image:radial-gradient(circle,rgba(255,255,255,.95)_1px,transparent_1.5px),radial-gradient(circle,rgba(34,211,238,.8)_1px,transparent_1.5px),radial-gradient(circle,rgba(244,114,182,.65)_1px,transparent_1.5px)] [background-position:12px_20px,80px_100px,150px_40px] [background-size:170px_170px,230px_230px,310px_310px]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:100%_5px]" />
      <div className="pointer-events-none fixed -left-48 top-32 -z-10 h-[34rem] w-[34rem] rounded-full border border-cyan-300/10 shadow-[0_0_90px_rgba(34,211,238,.1),inset_0_0_90px_rgba(34,211,238,.08)]" />
      <div className="pointer-events-none fixed -right-56 bottom-0 -z-10 h-[42rem] w-[42rem] rounded-full border border-fuchsia-300/10 shadow-[0_0_120px_rgba(217,70,239,.12),inset_0_0_100px_rgba(217,70,239,.07)]" />
      <div className="relative z-10 mx-auto min-w-0 max-w-[1500px] space-y-4">
        <header className="neon-card relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-[#080b1c]/75 p-5 shadow-[0_0_45px_rgba(34,211,238,.13),inset_0_0_34px_rgba(217,70,239,.05)] backdrop-blur-xl sm:p-6">''')
replace(
'''          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">''',
'''          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_14px_rgba(34,211,238,.9)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">''')
replace(
'''              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles className="h-4 w-4" /> DRAKSIDE MARKETING
              </div>''',
'''              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">
                <span className="flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 shadow-[0_0_18px_rgba(34,211,238,.14)]"><Sparkles className="h-3.5 w-3.5" /> DRAKSIDE // SECRET GALLERY</span>
                <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-fuchsia-200">SECTOR 07 · LOCAL VAULT</span>
              </div>''')
replace(
'''              <h1 className="cyber-title mt-2 text-3xl font-bold text-white sm:text-4xl">
                DRAKSIDE MARKETING
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-fuchsia-100/60">
                การตลาดที่ไม่แข่งขัน แต่ไม่มีใครตามทัน
              </p>''',
'''              <h1 className="cyber-title mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                DRAKSIDE <span className="text-cyan-300 [text-shadow:0_0_22px_rgba(34,211,238,.65)]">MARKETING</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-fuchsia-100/65">
                ห้องบัญชาการข้อมูล · โค้ด · โปรเจกต์ · สัญญาณจากหลายจักรวาล
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
                <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">● CORE ONLINE</span>
                <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">LOCAL AUTOSAVE</span>
                <span className="rounded-md border border-fuchsia-300/25 bg-fuchsia-300/10 px-2.5 py-1 text-fuchsia-200">3 DATA LANES</span>
              </div>''')
replace('className="border-cyan-400/30 bg-transparent text-cyan-200"','className="border-cyan-300/35 bg-cyan-300/5 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.1)] hover:border-cyan-200/70 hover:bg-cyan-300/15"')
replace('className="bg-gradient-to-r from-fuchsia-600 to-violet-700"','className="bg-gradient-to-r from-fuchsia-600 via-violet-700 to-cyan-600 shadow-[0_0_24px_rgba(217,70,239,.28)] hover:brightness-125"',1)
replace('className="border-fuchsia-400/25 bg-transparent text-fuchsia-100"','className="border-fuchsia-300/30 bg-fuchsia-300/5 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,.1)] hover:border-fuchsia-200/70 hover:bg-fuchsia-300/15"')
replace('className="neon-card rounded-3xl border-cyan-400/20 bg-black/20"','className="neon-card relative overflow-hidden rounded-3xl border-violet-300/25 bg-[#070b1c]/70 shadow-[0_0_34px_rgba(139,92,246,.12),inset_0_0_30px_rgba(34,211,238,.03)] backdrop-blur-xl"')
replace('''              MAIN ORDER · HERMES / MULTIVERSE / SINGULARITY
            </CardTitle>''','''              MAIN ORDER · HERMES / MULTIVERSE / SINGULARITY
              <span className="ml-auto rounded border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[9px] font-mono tracking-[0.18em] text-violet-200/75">UPLINK 01</span>
            </CardTitle>''')

p.write_text(s)
print('applied', p)
