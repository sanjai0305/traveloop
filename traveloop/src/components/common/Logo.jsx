// src/components/common/Logo.jsx

import React from "react";
import { Plane } from "lucide-react";

const Logo = () => {
  return (
    <div
      className="
        flex
        items-center
        justify-center
      "
    >
      
      {/* LOGO CONTAINER */}
      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        
        {/* ICON WRAPPER */}
        <div
          className="
            relative
            
            w-16
            h-16
            
            md:w-18
            md:h-18
            
            rounded-2xl
            
            bg-gradient-to-br
            from-teal-500
            via-cyan-500
            to-sky-500
            
            flex
            items-center
            justify-center
            
            shadow-[0_10px_35px_rgba(6,182,212,0.35)]
            
            overflow-hidden
            
            animate-float
          "
        >
          
          {/* GLOW EFFECT */}
          <div
            className="
              absolute
              inset-0
              bg-white/10
            "
          />

          {/* PLANE ICON */}
          <Plane
            size={30}
            className="
              text-white
              rotate-[-25deg]
              relative
              z-10
            "
          />
        </div>

        {/* TEXT CONTENT */}
        <div>
          
          {/* BRAND NAME */}
          <h1
            className="
              text-4xl
              md:text-5xl
              
              font-extrabold
              
              bg-gradient-to-r
              from-teal-600
              via-cyan-500
              to-sky-500
              
              bg-clip-text
              text-transparent
              
              tracking-tight
            "
          >
            Traveloop
          </h1>

          {/* TAGLINE */}
          <p
            className="
              mt-1
              
              text-xs
              md:text-sm
              
              font-medium
              
              text-slate-500
              
              tracking-[3px]
              uppercase
            "
          >
            Plan • Explore • Experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logo;