class Customer {
  constructor(id, name, email, phone, type, address) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.type = type;
    this.address = address;
  }

  getName() {
    return this.name;
  }

  getEmail() {
    return this.email;
  }

  getType() {
    return this.type;
  }

  hasValidEmail() {
    return Boolean(this.email && this.email.includes("@"));
  }

  getRegion() {
    return this.address.getRegion();
  }

  getCity() {
    return this.address.getCity();
  }

  getState() {
    return this.address.getState();
  }

  getCityStateLabel() {
    return this.address.getCityStateLabel();
  }
}

module.exports = Customer;
