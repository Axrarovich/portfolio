// db.js
let categories = ["Elektronika", "Kitoblar", "Oziq-ovqat"];
let products = [
    {id: 1, name: "Laptop", price: 1500, category: "Elektronika", info: "Yangi model", quantity: 0, image: "https://via.placeholder.com/150?text=Laptop"},
    {id: 2, name: "Kitob", price: 20, category: "Kitoblar", info: "Qiziqarli hikoya", quantity: 0, image: "https://via.placeholder.com/150?text=Kitob"}
];

module.exports = { categories, products };
