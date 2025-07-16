class UserSession {
  constructor() {
    const savedUser = JSON.parse(localStorage.getItem("userSession")) || {};

    this.batchNumber = savedUser.batchNumber || "";
    this.degreeProgram = savedUser.degreeProgram || "";
    this.email = savedUser.email || "";
    this.faculty = savedUser.faculty || "";
    this.name = savedUser.name || "";
    this.role = savedUser.role || "";
    this.uid = savedUser.uid || "";
  }

  setUser(details) {
    this.batchNumber = details.batchNumber || "";
    this.degreeProgram = details.degreeProgram || "";
    this.email = details.email || "";
    this.faculty = details.faculty || "";
    this.name = details.name || "";
    this.role = details.role || "";
    this.uid = details.uid || "";

    // Save to localStorage
    localStorage.setItem("userSession", JSON.stringify(this.currentUser));
  }

  clearUser() {
    this.batchNumber = "";
    this.degreeProgram = "";
    this.email = "";
    this.faculty = "";
    this.name = "";
    this.role = "";
    this.uid = "";

    localStorage.removeItem("userSession");
  }

  get currentUser() {
    return {
      batchNumber: this.batchNumber,
      degreeProgram: this.degreeProgram,
      email: this.email,
      faculty: this.faculty,
      name: this.name,
      role: this.role,
      uid: this.uid
    };
  }
}

// Singleton instance
const userSession = new UserSession();
export default userSession;
