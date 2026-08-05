export default function Page() {
  return (
    <main className="formCard">
      <h1>Kayıt Ol</h1>
      <form><label>Ad Soyad</label><input /><label>E-posta</label><input type="email" /><label>Telefon</label><input /><label>Şifre</label><input type="password" /><button className="primary">HESAP OLUŞTUR</button></form>
    </main>
  );
}
