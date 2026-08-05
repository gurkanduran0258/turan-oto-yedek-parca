export default function Page() {
  return (
    <main className="formCard">
      <h1>Giriş Yap</h1>
      <form><label>E-posta</label><input type="email" placeholder="ornek@mail.com" /><label>Şifre</label><input type="password" placeholder="••••••••" /><button className="primary">GİRİŞ YAP</button><p>Hesabınız yok mu? <a href="/kayit">Kayıt olun</a></p></form>
    </main>
  );
}
