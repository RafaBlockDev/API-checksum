import axios from 'axios';

export const fetchAllBlocks = async (limit1: number = 0, limit2: number = 10) => {
    try {
        const response = await axios.get(`${process.env.API_SIDECAR_URL}/blocks/?range=${limit1}-${limit2}`);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error("Error al obtener los bloques:", error);
        throw error;
    }
};
