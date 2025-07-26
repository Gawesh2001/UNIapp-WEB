class UserSession {
  constructor() {
    this.listeners = new Set();
    this.loadFromStorage();
  }

  loadFromStorage() {
    const savedUser = JSON.parse(localStorage.getItem("userSession")) || {};
    this.batchNumber = savedUser.batchNumber || "";
    this.degreeProgram = savedUser.degreeProgram || "";
    this.email = savedUser.email || "";
    this.faculty = savedUser.faculty || "";
    this.name = savedUser.name || "";
    this.role = savedUser.role || "";
    this.uid = savedUser.uid || "";
    this.notifyListeners();
  }

  setUser(details) {
    this.batchNumber = details.batchNumber || "";
    this.degreeProgram = details.degreeProgram || "";
    this.email = details.email || "";
    this.faculty = details.faculty || "";
    this.name = details.name || "";
    this.role = details.role || "";
    this.uid = details.uid || "";
    localStorage.setItem("userSession", JSON.stringify(this.currentUser));
    this.notifyListeners();
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
    this.notifyListeners();
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

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

const userSession = new UserSession();
export default userSession;