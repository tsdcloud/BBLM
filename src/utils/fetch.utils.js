export const fetchData= async(url, token)=>{
    try {
        let requestOptions = {
            headers:{
                'authorization':`Bearer ${token}`,
                'Content-Type':'application/json'
            },
            method:"GET",
        }
        let response = await fetch(`${url}`, requestOptions);
        if(response.status === 200){
            return response.json();
        }
    } catch (error) {
        console.log(error)
        throw new Error(`Failed to fetch`)
    }
}