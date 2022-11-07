export const config = {
    token: 'BNB',
    network: 'BSC', // if an invalid value is entered, you will get a list of available networks
    amount: 0.001, // if you want to get random amounts, slightly increase this value
    randomizeAmount: true,  // if true, the final amount will be slightly less for a percent below
    spread: 0.5, // in percents, the final amount will be less for random percent up to this value, increase this value for a cheap coins to get more random values
    delay: { min: 5, max: 20 },  // in seconds
    apikey: '1mZsNHUvb0mgBvveleXi9dtMn8uUDxANGGAJxcpuHPMqoQt3uGPZTYkCrdhe1ewKz',
    secret: '654WzupeDawrs9lpaTIFlHmS8mt34qC7QEjoNKYqZ9PxAWoS9uuAC4Fjtl26Gd6h1'
}