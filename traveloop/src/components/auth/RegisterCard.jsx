// src/components/auth/RegisterCard.jsx

import React from "react";
import { Link } from "react-router-dom";

// COMPONENTS
import Logo from "../common/Logo";
import RegisterForm from "./RegisterForm";

// IMAGE
import Luggage from "../../assets/images/luggage.png";

const RegisterCard = () => {
  return (
    <div
      className="
        relative
        
        w-full
        max-w-5xl
        
        px-8
        md:px-12
        
        py-10
        md:py-12
        
        rounded-[40px]
        
        bg-white/85
        backdrop-blur-2xl
        
        border
        border-white/40
        
        shadow-[0_20px_80px_rgba(15,23,42,0.15)]
        
        overflow-hidden
      "
    >
      
      {/* TOP GLOW */}
      <div
        className="
          absolute
          top-[-100px]
          right-[-80px]
          
          w-72
          h-72
          
          bg-cyan-300/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* BOTTOM GLOW */}
      <div
        className="
          absolute
          bottom-[-120px]
          left-[-100px]
          
          w-72
          h-72
          
          bg-teal-300/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10">
        
        {/* LOGO */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* LUGGAGE IMAGE */}
        <div className="flex justify-center mt-8">
          <div
            className="
              relative
              
              flex
              items-center
              justify-center
              
              w-36
              h-36
              
              rounded-full
              
              bg-gradient-to-br
              from-teal-100
              via-cyan-50
              to-sky-100
              
              shadow-inner
            "
          >
            
            {/* ROTATING BORDER */}
            <div
              className="
                absolute
                inset-0
                
                rounded-full
                
                border-2
                border-dashed
                border-teal-300
                
                animate-spin
                [animation-duration:18s]
              "
            />

            {/* IMAGE */}
            <img
              src={Luggage}
              alt="Travel"
              className="
                w-24
                h-24
                object-contain
                relative
                z-10
                animate-float
              "
            />
          </div>
        </div>

        {/* HEADING */}
        <div className="text-center mt-6">
          
          <h2
            className="
              text-2xl
              sm:text-4xl
              md:text-5xl
              
              font-extrabold
              
              text-slate-800
              
              leading-tight
            "
          >
            Create Your Account
          </h2>

          <p
            className="
              mt-2
              
              text-slate-500
              
              text-base
              md:text-lg
              
              leading-6
            "
          >
            Join Traveloop and start planning
            your adventures around the world.
          </p>
        </div>

        {/* FORM */}
        <div className="mt-6">
          <RegisterForm />
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <p
            className="
              text-slate-500
              text-sm
              md:text-base
            "
          >
            Already have an account?{" "}
            
            <Link
              to="/"
              className="
                font-bold
                
                bg-gradient-to-r
                from-teal-600
                to-cyan-500
                
                bg-clip-text
                text-transparent
                
                hover:opacity-80
                
                transition
              "
            >
              Login
            </Link>
          </p>

          {/* TERMS & PRIVACY LINKS FOOTER */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-center gap-4 text-xs font-bold text-slate-400 w-full max-w-xs">
            <Link to="/terms-and-conditions" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-teal-600 dark:hover:text-teal-450 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCard;