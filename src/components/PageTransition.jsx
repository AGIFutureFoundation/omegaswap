import { AnimatePresence, motion } from "framer-motion";
import { useNavigationType } from "react-router-dom";

const variants = {
  enter: (d) => ({ x: d * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d * -40, opacity: 0 }),
};

// Push = slide in from the right, pop (back) = slide in from the left
export default function PageTransition({ routeKey, children }) {
  const dir = useNavigationType() === "POP" ? -1 : 1;
  return (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div
        key={routeKey}
        custom={dir}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="overflow-x-clip"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}