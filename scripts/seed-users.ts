import "dotenv/config";

import { registerDemoUser } from "../lib/demo-auth-store";

const PASSWORD = "Test123456!";
const COUNT = 10;

async function main() {
  console.log(`Kayit: ${COUNT} kullanici (DATABASE_URL)`);
  let ok = 0;
  let skip = 0;
  for (let i = 1; i <= COUNT; i++) {
    const n = String(i).padStart(2, "0");
    const email = `seed${n}@oyunticaret.local`;
    const displayName = `Seed Kullanici ${n}`;
    const r = await registerDemoUser({
      email,
      password: PASSWORD,
      displayName,
      initialBalanceTL: 0,
    });
    if (r.ok) {
      ok++;
      console.log(`  + ${email}`);
    } else {
      skip++;
      console.log(`  = atlandi ${email}: ${r.error}`);
    }
  }
  console.log(`Tamam: ${ok} yeni, ${skip} atlandi. Sifre (hepsi): ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
