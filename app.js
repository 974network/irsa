const form = document.getElementById("clientForm");
const thankyou = document.getElementById("thankyou");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => (data[key] = value));

  const scriptURL = "ضع هنا رابط Google Script بعد نشره كخدمة ويب";

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      form.classList.add("hidden");
      thankyou.classList.remove("hidden");
    } else {
      alert("حدث خطأ أثناء الإرسال، حاول مرة أخرى.");
    }
  } catch (error) {
    alert("خطأ في الاتصال بالخادم.");
  }
});
