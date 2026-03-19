async function login() {
  const usernameInput = "40418311";
  const passwordInput = "Jurado$558";
  //const usernameInput = document.getElementById("usernameInput").value
  //const passwordInput = document.getElementById("passwordInput").value

  const url = "http://bcri.telefonicassd.com.br:8000/api/login";

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
      }),
    });

    const data = await response.json();

    if (data.token) {
      document.cookie = `token=${data.token}; path=/; secure; SameSite=Lax; max-age=3600`;
    } else {
      console.error("Erro ao salvar o token");
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function getLoggedUser() {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const response = await fetch("http://bcri.telefonicassd.com.br:8000/api/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return data;
}

const auth = {
  login,
  getLoggedUser,
};

export default auth;
