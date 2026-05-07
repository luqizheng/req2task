import { ref, toRaw,shallowRef  } from "vue";

const useListEdit = <T>(
  initialList: T[],
  options: {
    isPersist?: (item: T) => boolean;
    onRemove?: (item: T) => void;
    onEdited?: (item: T) => void;
    onCancelEditing?: () => void;
    onDelete?: (item: T) => Promise<void>;
  },
) => {
  const list = shallowRef <T[]>(initialList);
  const currentBackupItem = ref<T | undefined>();
  let currentIndex = ref(-1);

  const removeIndex = async (index: number) => {
    const item = toRaw(list.value.splice(index, 1)) as T;
    if (!options.isPersist?.(item)) await options.onDelete?.(item);
    options.onRemove?.(item);
  };

  const setEditing = (index: number) => {
    const src = list.value[index];
    currentIndex.value = index;
    currentBackupItem.value = { ...src } as T;
  };

  const cancelEditing = () => {
    list.value[currentIndex.value] = { ...currentBackupItem.value } as T;
    currentBackupItem.value = undefined;
    currentIndex.value = -1;
  };

  return {
    save: async () => {
    
      options.onEdited?.(toRaw(list.value[currentIndex.value] as T));
    },
    list,
    setEditing,
    cancelEditing,
    removeIndex,
    isEditing: (index: number) => {
      return index === currentIndex.value;
    },
  };
};

export default useListEdit;
