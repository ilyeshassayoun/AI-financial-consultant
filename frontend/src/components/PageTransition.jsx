import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  enter: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.09, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.05, ease: 'easeOut' }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.1, ease: [0.16, 1, 0.3, 1] }
  }
};

export function PageTransition({ children, transitionKey }) {
  const reduceMotion = useReducedMotion();

  // Replacing this keyed wrapper unmounts the previous route immediately.
  // The incoming page still animates, while assistive technology never sees
  // two complete application sections during an exit animation.
  return (
    <motion.div
      key={transitionKey}
      initial={reduceMotion ? false : 'initial'}
      animate={reduceMotion ? { opacity: 1 } : 'enter'}
      variants={pageVariants}
      style={{ width: '100%' }}
    >
      <motion.div variants={staggerContainer} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'}>
        {typeof children === 'function' ? children(staggerItem) : children}
      </motion.div>
    </motion.div>
  );
}

export function StaggeredChildren({ children, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={staggerContainer}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'show'}
      style={{ transitionDelay: delay }}
    >
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) 
          ? React.cloneElement(child, { 
              variants: staggerItem,
              style: { ...child.props.style, transitionDelay: index * 0.05 + delay }
            })
          : child
      )}
    </motion.div>
  );
}

export function FadeInUp({ children, delay = 0, className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInRight({ children, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 30 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={reduceMotion ? undefined : { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
