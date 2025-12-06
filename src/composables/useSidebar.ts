import { ref } from 'vue';

const isMinimized = ref(false);

export function useSidebar() {
    const toggle = () => {
        isMinimized.value = !isMinimized.value;
    };

    const setMinimized = (value: boolean) => {
        isMinimized.value = value;
    };

    return {
        isMinimized,
        toggle,
        setMinimized,
    };
}
